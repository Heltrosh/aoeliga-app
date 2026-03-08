PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id    TEXT NOT NULL UNIQUE,
  discord_name  TEXT,
  display_name  TEXT,
  avatar        TEXT,
  is_admin      INTEGER NOT NULL DEFAULT 0,
  is_banned     INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS tournaments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'draft', -- draft|active|completed|archived
  starts_at     TEXT,
  ends_at       TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rulesets (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  name               TEXT NOT NULL,
  config_json        TEXT NOT NULL,
  created_by_user_id INTEGER NOT NULL,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS divisions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  name          TEXT NOT NULL,
  ruleset_id    INTEGER,

  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (ruleset_id) REFERENCES rulesets(id) ON DELETE SET NULL,

  UNIQUE (tournament_id, name)
);

CREATE TABLE IF NOT EXISTS tournament_players (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  division_id   INTEGER,
  seed          INTEGER,
  status        TEXT NOT NULL DEFAULT 'pending', -- pending|active|rejected|withdrawn|banned
  joined_at     TEXT NOT NULL DEFAULT (datetime('now')),
  aoe_id        TEXT NOT NULL,

  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE RESTRICT,

  UNIQUE (tournament_id, user_id),
  UNIQUE (tournament_id, aoe_id)
);

CREATE TABLE IF NOT EXISTS tournament_admins (
  tournament_id INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin', -- admin|moderator

  PRIMARY KEY (tournament_id, user_id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tournament_streamers (
  tournament_id INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  stream_url    TEXT,

  PRIMARY KEY (tournament_id, user_id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id  INTEGER NOT NULL,
  division_id    INTEGER NOT NULL,
  stage          TEXT NOT NULL DEFAULT 'group', -- group|playoffs|custom
  round_number   INTEGER,
  week_number    INTEGER,
  player1_id     INTEGER NOT NULL,
  player2_id     INTEGER NOT NULL,
  player1_points INTEGER NOT NULL DEFAULT 0,
  player2_points INTEGER NOT NULL DEFAULT 0,
  scheduled_for  TEXT,
  state          TEXT NOT NULL DEFAULT 'created', -- created|scheduled|played|forfeited
  played_on      TEXT,

  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE,
  FOREIGN KEY (player1_id) REFERENCES tournament_players(id) ON DELETE RESTRICT,
  FOREIGN KEY (player2_id) REFERENCES tournament_players(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS replays (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id          INTEGER NOT NULL,
  tournament_id     INTEGER NOT NULL,
  uploaded_by       INTEGER,
  uploaded_at       TEXT NOT NULL DEFAULT (datetime('now')),
  r2_object_key     TEXT NOT NULL,
  file_size_bytes   INTEGER,
  content_hash      TEXT,
  original_filename TEXT,
  parse_status      TEXT NOT NULL DEFAULT 'pending', -- pending|parsed|failed
  parse_error       TEXT,

  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE (tournament_id, r2_object_key)
);

CREATE TABLE IF NOT EXISTS match_units (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id   INTEGER NOT NULL,
  unit_index INTEGER NOT NULL,
  replay_id  INTEGER NOT NULL,
  winner_id  INTEGER NOT NULL,
  loser_id   INTEGER NOT NULL,

  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (replay_id) REFERENCES replays(id) ON DELETE RESTRICT,
  FOREIGN KEY (winner_id) REFERENCES tournament_players(id) ON DELETE RESTRICT,
  FOREIGN KEY (loser_id) REFERENCES tournament_players(id) ON DELETE RESTRICT,

  UNIQUE (match_id, unit_index),
  UNIQUE (replay_id),
  CHECK (winner_id <> loser_id)
);

CREATE INDEX IF NOT EXISTS idx_divisions_tournament         ON divisions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_rulesets_creator             ON rulesets(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tp_tournament                ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tp_division                  ON tournament_players(division_id);
CREATE INDEX IF NOT EXISTS idx_tp_tournament_status         ON tournament_players(tournament_id, status);
CREATE INDEX IF NOT EXISTS idx_ta_user                      ON tournament_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_ts_user                      ON tournament_streamers(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament           ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_div_stage_round      ON matches(division_id, stage, round_number);
CREATE INDEX IF NOT EXISTS idx_matches_div_stage_week       ON matches(division_id, stage, week_number);
CREATE INDEX IF NOT EXISTS idx_matches_players              ON matches(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_replays_tournament_status    ON replays(tournament_id, parse_status);
CREATE INDEX IF NOT EXISTS idx_replays_match                ON replays(match_id);
CREATE INDEX IF NOT EXISTS idx_units_match                  ON match_units(match_id);
CREATE INDEX IF NOT EXISTS idx_units_winner                 ON match_units(winner_id);
