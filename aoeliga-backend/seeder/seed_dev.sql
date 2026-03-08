PRAGMA foreign_keys = ON;

-- ============================================================
-- DEV SEED (safe to re-run; matches inserted only if none exist)
-- ============================================================

BEGIN TRANSACTION;

-- ----------------------------
-- Ruleset
-- ----------------------------
INSERT OR IGNORE INTO rulesets (id, name, config_json)
VALUES (
  1,
  'Default League Rules',
  '{"stages":"group,playoffs", "group":"pa3,roundrobin", "playoffs":"bo5,gauntlet", "special":"bo7,final"}'
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
INSERT OR IGNORE INTO divisions (id, tournament_id, name, ruleset_id)
VALUES
  (1, 1, 'Division 1', 1),
  (2, 1, 'Division 2', 1);

-- ----------------------------
-- Users (fake Discord IDs)
-- discord_id must be unique and "looks like" Discord snowflake (as text)
-- ----------------------------
INSERT OR IGNORE INTO users (id, discord_id, discord_name, display_name, avatar, is_admin)
VALUES
  (1, '164698420777320448', 'heltrosh', 'Heltrosh', 'b5bb8a4921fee3dff2bdbdfd08f4e7a3', 1),
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
INSERT OR IGNORE INTO tournament_players (id, tournament_id, user_id, division_id, seed, status, aoe_id)
VALUES
  (1, 1, 1, 1, 1, 'active', 2047125),
  (2, 1, 2, 1, 2, 'active', 498754),
  (3, 1, 3, 1, 3, 'active', 123456),
  (4, 1, 4, 1, 4, 'active', 234567),

  (5, 1, 5, 2, 1, 'active', 345678),
  (6, 1, 6, 2, 2, 'active', 456789),
  (7, 1, 7, 2, 3, 'active', 567891),
  (8, 1, 8, 2, 4, 'active', 678912);

-- ----------------------------
-- Matches (only if there are none yet for this tournament)
-- ----------------------------
-- Div 1
INSERT INTO matches (tournament_id, division_id, stage, week_number, round_number, player1_id, player2_id)
SELECT 1, 1, 'group', 1, NULL, 1, 2
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = 1);

INSERT INTO matches (tournament_id, division_id, stage, week_number, round_number, player1_id, player2_id)
SELECT 1, 1, 'group', 1, NULL, 3, 4
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = 1);

INSERT INTO matches (tournament_id, division_id, stage, week_number, round_number, player1_id, player2_id)
SELECT 1, 1, 'group', 2, NULL, 1, 3
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = 1);

INSERT INTO matches (tournament_id, division_id, stage, week_number, round_number, player1_id, player2_id)
SELECT 1, 1, 'group', 2, NULL, 2, 4
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = 1);

-- Div 2
INSERT INTO matches (tournament_id, division_id, stage, week_number, round_number, player1_id, player2_id)
SELECT 1, 2, 'group', 1, NULL, 5, 6
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = 1);

INSERT INTO matches (tournament_id, division_id, stage, week_number, round_number, player1_id, player2_id)
SELECT 1, 2, 'group', 1, NULL, 7, 8
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = 1);

INSERT INTO matches (tournament_id, division_id, stage, week_number, round_number, player1_id, player2_id)
SELECT 1, 2, 'group', 2, NULL, 5, 7
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = 1);

INSERT INTO matches (tournament_id, division_id, stage, week_number, round_number, player1_id, player2_id)
SELECT 1, 2, 'group', 2, NULL, 6, 8
WHERE NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = 1);

COMMIT;