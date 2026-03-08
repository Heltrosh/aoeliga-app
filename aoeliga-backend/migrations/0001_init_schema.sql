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
  discord_name  TEXT,
  display_name  TEXT,
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
  config_json   TEXT NOT NULL                    -- JSON blob
);

-- ----------------------------
-- DIVISIONS (within a tournament)
-- ----------------------------
CREATE TABLE IF NOT EXISTS divisions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  name          TEXT NOT NULL,
  ruleset_id    INTEGER,

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

  seed          INTEGER,
  status        TEXT NOT NULL DEFAULT 'active',   -- active||withdrawn|banned
  joined_at     TEXT NOT NULL DEFAULT (datetime('now')),
  aoe_id        TEXT NOT NULL UNIQUE,

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
  role          TEXT NOT NULL DEFAULT 'admin',    -- admin|moderator|streamer

  PRIMARY KEY (tournament_id, user_id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----------------------------
-- MATCHES (containers)
-- League scheduling fields (week_number) and playoffs fields (stage/round_number).
-- Parser + ruleset will determine completion from match_units.
-- ----------------------------
CREATE TABLE IF NOT EXISTS matches (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  division_id   INTEGER NOT NULL,

  stage         TEXT NOT NULL DEFAULT 'group',    -- group|playoffs|custom
  round_number  INTEGER,                          -- for playoff rounds
  week_number   INTEGER,                          -- for league weeks (optional)

  player1_id INTEGER NOT NULL,                    -- tournament_players.id
  player2_id INTEGER NOT NULL,                    -- tournament_players.id
  player1_points INTEGER NOT NULL DEFAULT 0,
  player2_points INTEGER NOT NULL DEFAULT 0,

  scheduled_for TEXT,
  state         TEXT NOT NULL DEFAULT 'created', -- created|scheduled|played|forfeited
  played_on     TEXT,

  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE,
  FOREIGN KEY (player1_id) REFERENCES tournament_players(id) ON DELETE RESTRICT,
  FOREIGN KEY (player2_id) REFERENCES tournament_players(id) ON DELETE RESTRICT

);

-- ----------------------------
-- REPLAY FILES (uploaded to R2; parser reads these and writes match_units)
-- This table is the queue/source-of-truth for parsing status.
-- ----------------------------
CREATE TABLE IF NOT EXISTS replays (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id         INTEGER NOT NULL,
  tournament_id    INTEGER NOT NULL,

  uploaded_by      INTEGER NOT NULL,              -- users.id (optional)
  uploaded_at      TEXT NOT NULL DEFAULT (datetime('now')),

  r2_object_key    TEXT NOT NULL,                 -- key in R2 bucket
  file_size_bytes  INTEGER,
  content_hash     TEXT,                          -- optional (sha256) for dedupe
  original_filename TEXT,

  parse_status     TEXT NOT NULL DEFAULT 'pending', -- pending|parsed|failed
  parse_error      TEXT,

  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,

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
  replay_id     INTEGER NOT NULL,

  winner_id     INTEGER NOT NULL,                    -- tournament_players.id
  loser_id      INTEGER NOT NULL,                    -- tournament_players.id
  
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (replay_id) REFERENCES replays(id) ON DELETE RESTRICT,
  FOREIGN KEY (winner_id) REFERENCES tournament_players(id) ON DELETE RESTRICT,
  FOREIGN KEY (loser_id) REFERENCES tournament_players(id) ON DELETE RESTRICT,

  UNIQUE (match_id, unit_index),
  UNIQUE (replay_id),

  CHECK (winner_id <> loser_id)
);

-- ============================================================
-- Indexes (keep queries fast on D1)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_divisions_tournament     ON divisions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tp_tournament           ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tp_division             ON tournament_players(division_id);

CREATE INDEX IF NOT EXISTS idx_matches_div_stage_round  ON matches(division_id, stage, round_number);
CREATE INDEX IF NOT EXISTS idx_matches_div_stage_week         ON matches(division_id, stage, week_number);
CREATE INDEX IF NOT EXISTS idx_matches_players          ON matches(player1_id, player2_id);

CREATE INDEX IF NOT EXISTS idx_replays_tournament_status ON replays(tournament_id, parse_status);

CREATE INDEX IF NOT EXISTS idx_units_match              ON match_units(match_id);
CREATE INDEX IF NOT EXISTS idx_units_winner             ON match_units(winner_id);
