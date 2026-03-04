-- Migration number: 0001 	 2026-03-03T16:47:29.556Z
-- ============================================================
-- Tournament Manager v1 (Cloudflare D1 / SQLite)
-- - League seasons (tournaments) with divisions
-- - Players are users participating in a tournament (one division per tournament)
-- - Matches are containers; match_units are the per-map/per-game replays
-- - No draws (enforced in logic; schema allows only winner/loser in units/outcomes)
-- - Results are derived from uploaded replay files (no manual verification workflow)
-- ============================================================

PRAGMA foreign_keys = ON;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id    TEXT NOT NULL UNIQUE,
  username      TEXT,
  global_name   TEXT,
  avatar        TEXT,
  is_admin      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

-- ----------------------------
-- TOURNAMENTS (seasons)
-- ----------------------------
CREATE TABLE IF NOT EXISTS tournaments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,            -- nice URLs like /t/spring-2026
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'draft',   -- draft|active|completed|archived
  starts_at     TEXT,
  ends_at       TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------
-- RULESETS (format knobs: PA3, Bo5, Bo7, points, tiebreakers, etc.)
-- Store as JSON so formats can vary each season/division.
-- ----------------------------
CREATE TABLE IF NOT EXISTS rulesets (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  kind          TEXT NOT NULL,                   -- league|playoffs|hybrid|custom
  config_json   TEXT NOT NULL,                   -- JSON blob
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------
-- DIVISIONS (within a tournament)
-- ----------------------------
CREATE TABLE IF NOT EXISTS divisions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  name          TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  ruleset_id    INTEGER,                         -- optional; can be null until you configure

  created_at    TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (ruleset_id) REFERENCES rulesets(id) ON DELETE SET NULL,

  UNIQUE (tournament_id, name)
);

-- ----------------------------
-- TOURNAMENT PLAYERS (user participation in a tournament)
-- Exactly one division per tournament is enforced by this column (division_id).
-- ----------------------------
CREATE TABLE IF NOT EXISTS tournament_players (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  division_id   INTEGER NOT NULL,

  nickname      TEXT,                            -- optional per-season name
  seed          INTEGER,
  status        TEXT NOT NULL DEFAULT 'active',   -- active|inactive|withdrawn|banned
  joined_at     TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE RESTRICT,

  UNIQUE (tournament_id, user_id)
);

-- ----------------------------
-- TOURNAMENT ADMINS (scoped per tournament)
-- ----------------------------
CREATE TABLE IF NOT EXISTS tournament_admins (
  tournament_id INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',    -- admin|moderator
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),

  PRIMARY KEY (tournament_id, user_id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----------------------------
-- MATCHES (containers)
-- League scheduling fields (week_number) and playoffs fields (stage/round_number).
-- Your parser + ruleset will determine completion from match_units.
-- ----------------------------
CREATE TABLE IF NOT EXISTS matches (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  division_id   INTEGER NOT NULL,

  stage         TEXT NOT NULL DEFAULT 'league',   -- league|playoffs|gauntlet|finals|custom
  round_number  INTEGER,                          -- for playoff rounds
  week_number   INTEGER,                          -- for league weeks (optional)

  home_player_id INTEGER NOT NULL,                -- tournament_players.id
  away_player_id INTEGER NOT NULL,                -- tournament_players.id

  scheduled_for TEXT,
  state         TEXT NOT NULL DEFAULT 'scheduled', -- scheduled|ready|played|void

  created_at    TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE,
  FOREIGN KEY (home_player_id) REFERENCES tournament_players(id) ON DELETE RESTRICT,
  FOREIGN KEY (away_player_id) REFERENCES tournament_players(id) ON DELETE RESTRICT

);

-- ----------------------------
-- REPLAY FILES (uploaded to R2; parser reads these and writes match_units)
-- This table is the queue/source-of-truth for parsing status.
-- ----------------------------
CREATE TABLE IF NOT EXISTS replay_files (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id    INTEGER NOT NULL,

  uploaded_by_user_id INTEGER,                    -- users.id (optional)
  uploaded_at      TEXT NOT NULL DEFAULT (datetime('now')),

  r2_object_key    TEXT NOT NULL,                 -- key in R2 bucket
  file_size_bytes  INTEGER,
  content_hash     TEXT,                          -- optional (sha256) for dedupe
  original_filename TEXT,

  parse_status     TEXT NOT NULL DEFAULT 'pending', -- pending|parsed|failed
  parse_error      TEXT,

  -- Optional parsed metadata (helpful for debugging/UX)
  parsed_home_name TEXT,
  parsed_away_name TEXT,
  parsed_winner_side TEXT,                        -- 'home'|'away'|'unknown'
  parsed_started_at TEXT,
  parsed_ended_at   TEXT,

  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE (tournament_id, r2_object_key)
);

-- ----------------------------
-- MATCH UNITS (per-map or per-game inside a match)
-- Each replay file should map to exactly one unit (UNIQUE replay_file_id).
-- No draws: each unit has winner and loser.
-- ----------------------------
CREATE TABLE IF NOT EXISTS match_units (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id      INTEGER NOT NULL,
  unit_index    INTEGER NOT NULL,                 -- 1..N order within match
  replay_file_id INTEGER NOT NULL,

  winner_tp_id  INTEGER NOT NULL,                 -- tournament_players.id
  loser_tp_id   INTEGER NOT NULL,                 -- tournament_players.id
  recorded_at   TEXT,                             -- timestamp from replay if available

  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (replay_file_id) REFERENCES replay_files(id) ON DELETE RESTRICT,
  FOREIGN KEY (winner_tp_id) REFERENCES tournament_players(id) ON DELETE RESTRICT,
  FOREIGN KEY (loser_tp_id) REFERENCES tournament_players(id) ON DELETE RESTRICT,

  UNIQUE (match_id, unit_index),
  UNIQUE (replay_file_id),

  CHECK (winner_tp_id <> loser_tp_id)
);

-- ----------------------------
-- MATCH OUTCOMES (optional cache; derived from match_units per ruleset)
-- Useful for fast listing; you can recompute when units change.
-- No draws: winner/loser required.
-- ----------------------------
CREATE TABLE IF NOT EXISTS match_outcomes (
  match_id      INTEGER PRIMARY KEY,
  decided_at    TEXT NOT NULL DEFAULT (datetime('now')),

  winner_tp_id  INTEGER NOT NULL,
  loser_tp_id   INTEGER NOT NULL,

  home_units_won INTEGER NOT NULL,
  away_units_won INTEGER NOT NULL,

  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (winner_tp_id) REFERENCES tournament_players(id) ON DELETE RESTRICT,
  FOREIGN KEY (loser_tp_id) REFERENCES tournament_players(id) ON DELETE RESTRICT,

  CHECK (winner_tp_id <> loser_tp_id),
  CHECK (home_units_won >= 0 AND away_units_won >= 0),
  CHECK (home_units_won <> away_units_won)         -- no draws at match level
);

-- ============================================================
-- Indexes (keep queries fast on D1)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_divisions_tournament     ON divisions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tp_tournament           ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tp_division             ON tournament_players(division_id);

CREATE INDEX IF NOT EXISTS idx_matches_div_stage_round  ON matches(division_id, stage, round_number);
CREATE INDEX IF NOT EXISTS idx_matches_div_week         ON matches(division_id, week_number);
CREATE INDEX IF NOT EXISTS idx_matches_players          ON matches(home_player_id, away_player_id);

CREATE INDEX IF NOT EXISTS idx_replays_tournament_status ON replay_files(tournament_id, parse_status);

CREATE INDEX IF NOT EXISTS idx_units_match              ON match_units(match_id);
CREATE INDEX IF NOT EXISTS idx_units_winner             ON match_units(winner_tp_id);

-- Optional: prevent obvious bad data (same player vs themselves)
-- (SQLite can't reference other columns in CHECK beyond the row; this is enough for now.)
-- ============================================================