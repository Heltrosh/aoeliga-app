PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id    TEXT NOT NULL UNIQUE,
  discord_name  TEXT,
  display_name  TEXT,
  avatar        TEXT,
  is_admin      INTEGER NOT NULL DEFAULT 0,
  is_banned     INTEGER NOT NULL DEFAULT 0,
  ban_reason    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT,

  CHECK (is_admin IN (0, 1)),
  CHECK (is_banned IN (0, 1))
);

CREATE TABLE IF NOT EXISTS tournaments (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  slug                TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  description         TEXT,
  status              TEXT NOT NULL DEFAULT 'draft', -- draft|signup|active|completed|archived
  registrations_open  INTEGER NOT NULL DEFAULT 0,
  default_ruleset     INTEGER,
  recent_games_days   INTEGER,
  starts_at           TEXT,
  ends_at             TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (default_ruleset) REFERENCES rulesets(id) ON DELETE SET NULL,

  CHECK (status IN ('draft', 'signup', 'active', 'completed', 'archived'))
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

CREATE TABLE IF NOT EXISTS tournament_registrations (
  id                        INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id             INTEGER NOT NULL,
  user_id                   INTEGER NOT NULL,
  aoe_id                    TEXT NOT NULL,
  aoe_name                  TEXT,
  signup_rating             INTEGER,
  signup_max_rating         INTEGER,
  signup_team_rating        INTEGER,
  signup_max_team_rating    INTEGER,
  current_rating            INTEGER,
  current_max_rating        INTEGER,
  current_team_rating       INTEGER,
  current_max_team_rating   INTEGER,
  total_games               INTEGER,
  recent_games              INTEGER,
  current_data_fetched_at   TEXT,
  status                    TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected|withdrawn
  submitted_at              TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at                TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at               TEXT,
  reviewed_by               INTEGER,
  review_note               TEXT,
  note                      TEXT,

  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE (tournament_id, user_id),
  UNIQUE (tournament_id, aoe_id),

  CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn'))
);

CREATE TABLE IF NOT EXISTS tournament_players (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  registration_id INTEGER,
  division_id   INTEGER,
  seed          INTEGER,
  status        TEXT NOT NULL DEFAULT 'active', -- active|withdrawn|banned
  joined_at     TEXT NOT NULL DEFAULT (datetime('now')),
  aoe_id        TEXT NOT NULL,

  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (registration_id) REFERENCES tournament_registrations(id) ON DELETE SET NULL,
  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE RESTRICT,

  UNIQUE (tournament_id, user_id),
  UNIQUE (tournament_id, aoe_id),
  UNIQUE (registration_id),

  CHECK (status IN ('active', 'withdrawn', 'banned'))
);

CREATE TABLE IF NOT EXISTS tournament_admins (
  tournament_id INTEGER NOT NULL,
  user_id       INTEGER NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin', -- admin|moderator

  PRIMARY KEY (tournament_id, user_id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  CHECK (role IN ('admin', 'moderator'))
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
  status         TEXT NOT NULL DEFAULT 'created', -- created|scheduled|awaiting_report|played|forfeited
  played_on      TEXT,

  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE,
  FOREIGN KEY (player1_id) REFERENCES tournament_players(id) ON DELETE RESTRICT,
  FOREIGN KEY (player2_id) REFERENCES tournament_players(id) ON DELETE RESTRICT,

  CHECK (stage IN ('group', 'playoffs', 'custom')),
  CHECK (status IN ('created', 'scheduled', 'awaiting_report', 'played', 'forfeited')),
  CHECK (player1_id <> player2_id)  
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
  parse_status      TEXT NOT NULL DEFAULT 'pending', -- pending|parsing|parsed|failed
  parse_error       TEXT,

  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE (tournament_id, r2_object_key),

  CHECK (parse_status IN ('pending', 'parsing' ,'parsed', 'failed'))
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

CREATE TABLE IF NOT EXISTS match_vods (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id   INTEGER NOT NULL,
  url        TEXT NOT NULL,
  added_by   INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tournament_setup_sessions (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id       INTEGER NOT NULL UNIQUE,
  status              TEXT NOT NULL DEFAULT 'draft',
  distribution_mode   TEXT,
  selected_rating_key TEXT,
  created_by          INTEGER NOT NULL,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
  applied_at          TEXT,

  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,

  CHECK (status IN ('draft', 'ready', 'applied')),
  CHECK (distribution_mode IN ('rating', 'random') OR distribution_mode IS NULL),
  CHECK (
    selected_rating_key IN (
      'signup_rating',
      'signup_max_rating',
      'signup_team_rating',
      'signup_max_team_rating',
      'current_rating',
      'current_max_rating',
      'current_team_rating',
      'current_max_team_rating'
    ) OR selected_rating_key IS NULL
  )
);

CREATE TABLE IF NOT EXISTS tournament_setup_divisions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  setup_session_id INTEGER NOT NULL,
  name             TEXT NOT NULL,
  ruleset_id       INTEGER,
  sort_order       INTEGER NOT NULL,

  FOREIGN KEY (setup_session_id) REFERENCES tournament_setup_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (ruleset_id) REFERENCES rulesets(id) ON DELETE SET NULL,

  UNIQUE (setup_session_id, sort_order),
  UNIQUE (setup_session_id, name)
);

CREATE TABLE IF NOT EXISTS tournament_setup_player_assignments (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  setup_session_id    INTEGER NOT NULL,
  setup_division_id   INTEGER NOT NULL,
  registration_id     INTEGER NOT NULL,
  seed                INTEGER NOT NULL,
  sort_order          INTEGER NOT NULL,
  source_rating_value INTEGER,

  FOREIGN KEY (setup_session_id) REFERENCES tournament_setup_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (setup_division_id) REFERENCES tournament_setup_divisions(id) ON DELETE CASCADE,
  FOREIGN KEY (registration_id) REFERENCES tournament_registrations(id) ON DELETE CASCADE,

  UNIQUE (setup_session_id, registration_id),
  UNIQUE (setup_division_id, seed),
  UNIQUE (setup_division_id, sort_order)
);

CREATE TABLE IF NOT EXISTS tournament_setup_matches (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  setup_session_id        INTEGER NOT NULL,
  setup_division_id       INTEGER NOT NULL,
  stage_key               TEXT NOT NULL,
  stage_type              TEXT NOT NULL,
  round_number            INTEGER NOT NULL,
  round_label             TEXT,
  week_number             INTEGER,
  format_id               TEXT NOT NULL,
  player1_registration_id INTEGER,
  player2_registration_id INTEGER,

  FOREIGN KEY (setup_session_id) REFERENCES tournament_setup_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (setup_division_id) REFERENCES tournament_setup_divisions(id) ON DELETE CASCADE,
  FOREIGN KEY (player1_registration_id) REFERENCES tournament_registrations(id) ON DELETE SET NULL,
  FOREIGN KEY (player2_registration_id) REFERENCES tournament_registrations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_divisions_tournament         ON divisions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_rulesets_creator             ON rulesets(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_tr_tournament                     ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tr_tournament_status              ON tournament_registrations(tournament_id, status);
CREATE INDEX IF NOT EXISTS idx_tr_user                           ON tournament_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_tr_reviewed_by                    ON tournament_registrations(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_tp_tournament                ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tp_registration_id          ON tournament_players(registration_id);
CREATE INDEX IF NOT EXISTS idx_tp_division                  ON tournament_players(division_id);
CREATE INDEX IF NOT EXISTS idx_tp_tournament_status         ON tournament_players(tournament_id, status);

CREATE INDEX IF NOT EXISTS idx_ta_user                      ON tournament_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_ts_user                      ON tournament_streamers(user_id);

CREATE INDEX IF NOT EXISTS idx_matches_tournament           ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_div_stage_round      ON matches(division_id, stage, round_number);
CREATE INDEX IF NOT EXISTS idx_matches_div_stage_week       ON matches(division_id, stage, week_number);
CREATE INDEX IF NOT EXISTS idx_matches_players              ON matches(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status               ON matches(status);

CREATE INDEX IF NOT EXISTS idx_replays_tournament_status    ON replays(tournament_id, parse_status);
CREATE INDEX IF NOT EXISTS idx_replays_match                ON replays(match_id);

CREATE INDEX IF NOT EXISTS idx_units_match                  ON match_units(match_id);
CREATE INDEX IF NOT EXISTS idx_units_winner                 ON match_units(winner_id);

CREATE INDEX IF NOT EXISTS idx_match_vods_match             ON match_vods(match_id);
CREATE INDEX IF NOT EXISTS idx_match_vods_added_by          ON match_vods(added_by);
CREATE INDEX IF NOT EXISTS idx_tss_tournament_id           ON tournament_setup_sessions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tsd_session_id              ON tournament_setup_divisions(setup_session_id);
CREATE INDEX IF NOT EXISTS idx_tspa_session_id             ON tournament_setup_player_assignments(setup_session_id);
CREATE INDEX IF NOT EXISTS idx_tspa_division_id            ON tournament_setup_player_assignments(setup_division_id);
CREATE INDEX IF NOT EXISTS idx_tspm_session_id             ON tournament_setup_matches(setup_session_id);
CREATE INDEX IF NOT EXISTS idx_tspm_division_id            ON tournament_setup_matches(setup_division_id);
