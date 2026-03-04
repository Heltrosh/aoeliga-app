PRAGMA foreign_keys = ON;

-- ============================================================
-- DEV SEED (safe to re-run; matches inserted only if none exist)
-- ============================================================

BEGIN TRANSACTION;

-- ----------------------------
-- Ruleset
-- ----------------------------
INSERT OR IGNORE INTO rulesets (id, name, kind, config_json)
VALUES (
  1,
  'Default League Rules',
  'league',
  '{"format":"PA3 round robin","map_points":true,"bo":"3","notes":"Dev seed ruleset"}'
);

-- ----------------------------
-- Tournament
-- ----------------------------
INSERT OR IGNORE INTO tournaments (id, slug, name, description, status, starts_at, ends_at)
VALUES (
  1,
  'spring-2026',
  'Spring 2026',
  'Dev seed tournament for UI/API testing',
  'active',
  '2026-03-01',
  '2026-06-01'
);

-- ----------------------------
-- Divisions
-- ----------------------------
INSERT OR IGNORE INTO divisions (id, tournament_id, name, sort_order, ruleset_id)
VALUES
  (1, 1, 'Division 1', 1, 1),
  (2, 1, 'Division 2', 2, 1);

-- ----------------------------
-- Users (fake Discord IDs)
-- discord_id must be unique and "looks like" Discord snowflake (as text)
-- ----------------------------
INSERT OR IGNORE INTO users (id, discord_id, username, global_name, avatar, is_admin)
VALUES
  (1, '100000000000000001', 'admin1', 'Heltrosh', NULL, 1),
  (2, '100000000000000002', 'player2', 'Player Two', NULL, 0),
  (3, '100000000000000003', 'player3', 'Player Three', NULL, 0),
  (4, '100000000000000004', 'player4', 'Player Four', NULL, 0),
  (5, '100000000000000005', 'player5', 'Player Five', NULL, 0),
  (6, '100000000000000006', 'player6', 'Player Six', NULL, 0),
  (7, '100000000000000007', 'player7', 'Player Seven', NULL, 0),
  (8, '100000000000000008', 'player8', 'Player Eight', NULL, 0);

-- ----------------------------
-- Tournament Admin (scoped)
-- ----------------------------
INSERT OR IGNORE INTO tournament_admins (tournament_id, user_id, role)
VALUES (1, 1, 'admin');

-- ----------------------------
-- Tournament Players
-- 4 players in Div 1, 4 players in Div 2
-- ----------------------------
INSERT OR IGNORE INTO tournament_players (id, tournament_id, user_id, division_id, nickname, seed, status)
VALUES
  (1, 1, 1, 1, 'Heltrosh', 1, 'active'),
  (2, 1, 2, 1, NULL, 2, 'active'),
  (3, 1, 3, 1, NULL, 3, 'active'),
  (4, 1, 4, 1, NULL, 4, 'active'),

  (5, 1, 5, 2, NULL, 1, 'active'),
  (6, 1, 6, 2, NULL, 2, 'active'),
  (7, 1, 7, 2, NULL, 3, 'active'),
  (8, 1, 8, 2, NULL, 4, 'active');

-- ----------------------------
-- Matches (only if there are none yet for this tournament)
-- ----------------------------
-- Div 1
INSERT INTO matches (tournament_id, division_id, stage, week_number, round_number, home_player_id, away_player_id, scheduled_for, state)
SELECT 1, 1, 'league', 1, NULL, 1, 2, '2026-03-03T19:00:00Z', 'scheduled'
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = 1);

INSERT INTO matches (tournament_id, division_id, stage, week_number, round_number, home_player_id, away_player_id, scheduled_for, state)
SELECT 1, 1, 'league', 1, NULL, 3, 4, '2026-03-03T19:00:00Z', 'scheduled'
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = 1);

INSERT INTO matches (tournament_id, division_id, stage, week_number, round_number, home_player_id, away_player_id, scheduled_for, state)
SELECT 1, 1, 'league', 1, NULL, 1, 3, '2026-03-10T19:00:00Z', 'scheduled'
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = 1);

INSERT INTO matches (tournament_id, division_id, stage, week_number, round_number, home_player_id, away_player_id, scheduled_for, state)
SELECT 1, 1, 'league', 1, NULL, 2, 4, '2026-03-10T19:00:00Z', 'scheduled'
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = 1);

-- Div 2
INSERT INTO matches (tournament_id, division_id, stage, week_number, round_number, home_player_id, away_player_id, scheduled_for, state)
SELECT 1, 2, 'league', 1, NULL, 5, 6, '2026-03-03T19:00:00Z', 'scheduled'
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = 1);

INSERT INTO matches (tournament_id, division_id, stage, week_number, round_number, home_player_id, away_player_id, scheduled_for, state)
SELECT 1, 2, 'league', 1, NULL, 7, 8, '2026-03-03T19:00:00Z', 'scheduled'
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = 1);

INSERT INTO matches (tournament_id, division_id, stage, week_number, round_number, home_player_id, away_player_id, scheduled_for, state)
SELECT 1, 2, 'league', 1, NULL, 5, 7, '2026-03-10T19:00:00Z', 'scheduled'
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = 1);

INSERT INTO matches (tournament_id, division_id, stage, week_number, round_number, home_player_id, away_player_id, scheduled_for, state)
SELECT 1, 2, 'league', 1, NULL, 6, 8, '2026-03-10T19:00:00Z', 'scheduled'
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = 1);

COMMIT;