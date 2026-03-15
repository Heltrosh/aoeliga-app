PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- ============================================================
-- CLEAN DEV RESET ORDER
-- ============================================================
DELETE FROM match_vods;
DELETE FROM match_units;
DELETE FROM replays;
DELETE FROM matches;
DELETE FROM tournament_streamers;
DELETE FROM tournament_admins;
DELETE FROM tournament_players;
DELETE FROM tournament_registrations;
DELETE FROM divisions;
DELETE FROM rulesets;
DELETE FROM tournaments;
DELETE FROM users;

-- Reset autoincrement counters for predictable IDs in dev
DELETE FROM sqlite_sequence
WHERE name IN (
  'users',
  'tournaments',
  'rulesets',
  'divisions',
  'tournament_registrations',
  'tournament_players',
  'matches',
  'replays',
  'match_units',
  'match_vods'
);

-- ============================================================
-- USERS
-- ============================================================
INSERT INTO users (id, discord_id, discord_name, display_name, avatar, is_admin, is_banned, last_login_at)
VALUES
  (1,  '164698420777320448', 'heltrosh',   'Heltrosh',      'b5bb8a4921fee3dff2bdbdfd08f4e7a3', 1, 0, '2026-03-10 18:30:00'),
  (2,  '100000000000000002', 'player2',    'Player Two',    NULL, 0, 0, '2026-03-10 18:31:00'),
  (3,  '100000000000000003', 'player3',    'Player Three',  NULL, 0, 0, '2026-03-10 18:32:00'),
  (4,  '100000000000000004', 'player4',    'Player Four',   NULL, 0, 0, '2026-03-10 18:33:00'),
  (5,  '100000000000000005', 'player5',    'Player Five',   NULL, 0, 0, '2026-03-10 18:34:00'),
  (6,  '100000000000000006', 'player6',    'Player Six',    NULL, 0, 0, '2026-03-10 18:35:00'),
  (7,  '100000000000000007', 'player7',    'Player Seven',  NULL, 0, 0, '2026-03-10 18:36:00'),
  (8,  '100000000000000008', 'player8',    'Player Eight',  NULL, 0, 0, '2026-03-10 18:37:00'),
  (9,  '100000000000000009', 'caster1',    'Caster One',    NULL, 0, 0, '2026-03-10 18:38:00'),
  (10, '100000000000000010', 'mod1',       'Moderator One', NULL, 0, 0, '2026-03-10 18:39:00'),
  (11, '100000000000000011', 'pending1',   'Pending One',   NULL, 0, 0, '2026-03-10 18:40:00'),
  (12, '100000000000000012', 'pending2',   'Pending Two',   NULL, 0, 0, '2026-03-10 18:41:00'),
  (13, '100000000000000013', 'rejected1',  'Rejected One',  NULL, 0, 0, '2026-03-10 18:42:00');

-- ============================================================
-- RULESET
-- ============================================================
INSERT INTO rulesets (id, name, config_json, created_by_user_id, created_at)
VALUES
  (
    1,
    'Default League Rules',
    json('{
    "version": 1,
    "calendar": {
      "round_duration_days": 7
    },
    "match_formats": {
      "bo3": {
        "type": "best_of",
        "games": 3
      },
      "bo5": {
        "type": "best_of",
        "games": 5
      },
      "bo7": {
        "type": "best_of",
        "games": 7
      }
    },
    "scoring_systems": {
      "league_points": {
        "type": "match_points",
        "win": 3,
        "loss": 0,
        "draw": 0
      }
    },
    "stages": [
      {
        "id": "group_stage",
        "name": "Group Stage",
        "type": "round_robin",
        "round_robin": {
          "legs": 1
        },
        "participants": {
          "source": "division_players"
        },
        "cadence": {
          "round_duration_days": 7
        },
        "match_format_policy": {
          "default_format": "bo3"
        },
        "scoring": {
          "system": "league_points"
        },
        "advancement": {
          "type": "top_n",
          "count": 4
        },
        "tiebreakers": [
          "match_points",
          "head_to_head",
          "game_difference",
          "games_won"
        ]
      },
      {
        "id": "playoffs",
        "name": "Playoffs",
        "type": "single_elimination",
        "participants": {
          "source": "previous_stage",
          "stage_id": "group_stage",
          "selector": {
            "type": "top_n",
            "count": 4
          }
        },
        "seeding": {
          "type": "previous_stage_rank"
        },
        "cadence": {
          "round_duration_days": 7
        },
        "match_format_policy": {
          "default_format": "bo5",
          "overrides": [
            {
              "round": "final",
              "format": "bo7"
            }
          ]
        }
      }
    ]
  }'),    
  1,
  '2026-02-12 10:00:00'
  );


-- ============================================================
-- TOURNAMENT
-- ============================================================
INSERT INTO tournaments (id, slug, name, description, status, default_ruleset, starts_at, ends_at, created_at)
VALUES
  (
    1,
    'spring-2026',
    'Spring 2026',
    'Dev seed tournament for UI/API testing',
    'active',
    1,
    '2026-03-01',
    '2026-06-01',
    '2026-02-10 12:00:00'
  );

-- ============================================================
-- DIVISIONS
-- ============================================================
INSERT INTO divisions (id, tournament_id, name, ruleset_id)
VALUES
  (1, 1, 'Division 1', 1),
  (2, 1, 'Division 2', 1);

-- ============================================================
-- TOURNAMENT ADMINS / MODERATORS / STREAMERS
-- ============================================================
INSERT INTO tournament_admins (tournament_id, user_id, role)
VALUES
  (1, 1, 'admin'),
  (1, 10, 'moderator');

INSERT INTO tournament_streamers (tournament_id, user_id, stream_url)
VALUES
  (1, 9, 'https://www.twitch.tv/casterone');

-- ============================================================
-- REGISTRATIONS
-- Note:
-- - users 1..8 are approved and became players
-- - users 11..12 are still pending
-- - user 13 was rejected
-- ============================================================
INSERT INTO tournament_registrations (
  id,
  tournament_id,
  user_id,
  aoe_id,
  signup_rating,
  signup_max_rating,
  signup_team_rating,
  signup_max_team_rating,
  current_rating,
  current_max_rating,
  current_team_rating,
  current_max_team_rating,
  current_rating_fetched_at,
  status,
  submitted_at,
  reviewed_at,
  reviewed_by,
  note
)
VALUES
  (1, 1, 1,  '2047125', 1820, 1865, 1901, 1930, 1841, 1865, 1910, 1930, '2026-03-10 12:00:00', 'approved',  '2026-02-15 09:00:00', '2026-02-18 10:00:00', 1,  'Returning top division player'),
  (2, 1, 2,  '498754',  1710, 1742, 1765, 1790, 1725, 1742, 1772, 1790, '2026-03-10 12:00:00', 'approved',  '2026-02-15 09:05:00', '2026-02-18 10:01:00', 1,  NULL),
  (3, 1, 3,  '123456',  1650, 1672, 1685, 1704, 1668, 1680, 1691, 1708, '2026-03-10 12:00:00', 'approved',  '2026-02-15 09:10:00', '2026-02-18 10:02:00', 10, NULL),
  (4, 1, 4,  '234567',  1588, 1604, 1620, 1640, 1592, 1609, 1628, 1642, '2026-03-10 12:00:00', 'approved',  '2026-02-15 09:15:00', '2026-02-18 10:03:00', 10, NULL),

  (5, 1, 5,  '345678',  1505, 1524, 1540, 1560, 1519, 1528, 1549, 1568, '2026-03-10 12:00:00', 'approved',  '2026-02-15 09:20:00', '2026-02-18 10:04:00', 1,  NULL),
  (6, 1, 6,  '456789',  1440, 1461, 1480, 1498, 1455, 1468, 1487, 1504, '2026-03-10 12:00:00', 'approved',  '2026-02-15 09:25:00', '2026-02-18 10:05:00', 1,  NULL),
  (7, 1, 7,  '567891',  1375, 1390, 1410, 1430, 1382, 1399, 1419, 1435, '2026-03-10 12:00:00', 'approved',  '2026-02-15 09:30:00', '2026-02-18 10:06:00', 10, NULL),
  (8, 1, 8,  '678912',  1310, 1332, 1350, 1370, 1322, 1338, 1357, 1374, '2026-03-10 12:00:00', 'approved',  '2026-02-15 09:35:00', '2026-02-18 10:07:00', 10, NULL),

  (9,  1, 11, '789123', 1260, 1278, 1295, 1312, 1268, 1284, 1301, 1318, '2026-03-10 12:00:00', 'pending',   '2026-03-05 14:00:00', NULL, NULL, 'Wants to join if slots open'),
  (10, 1, 12, '789124', 1198, 1210, 1235, 1250, 1204, 1218, 1241, 1256, '2026-03-10 12:00:00', 'pending',   '2026-03-06 15:00:00', NULL, NULL, NULL),
  (11, 1, 13, '789125', 1100, 1114, 1140, 1152, 1100, 1114, 1140, 1152, '2026-03-10 12:00:00', 'rejected',  '2026-03-06 16:00:00', '2026-03-07 10:00:00', 1, 'Smurf suspicion in dev seed');

-- ============================================================
-- TOURNAMENT PLAYERS
-- 4 players in Division 1, 4 players in Division 2
-- ============================================================
INSERT INTO tournament_players (
  id,
  tournament_id,
  user_id,
  division_id,
  seed,
  status,
  joined_at,
  aoe_id
)
VALUES
  (1, 1, 1, 1, 1, 'active', '2026-02-18 10:00:00', '2047125'),
  (2, 1, 2, 1, 2, 'active', '2026-02-18 10:01:00', '498754'),
  (3, 1, 3, 1, 3, 'active', '2026-02-18 10:02:00', '123456'),
  (4, 1, 4, 1, 4, 'active', '2026-02-18 10:03:00', '234567'),

  (5, 1, 5, 2, 1, 'active', '2026-02-18 10:04:00', '345678'),
  (6, 1, 6, 2, 2, 'active', '2026-02-18 10:05:00', '456789'),
  (7, 1, 7, 2, 3, 'active', '2026-02-18 10:06:00', '567891'),
  (8, 1, 8, 2, 4, 'active', '2026-02-18 10:07:00', '678912');

-- ============================================================
-- MATCHES
-- Mix of statuses for UI/API testing
-- ============================================================
INSERT INTO matches (
  id,
  tournament_id,
  division_id,
  stage,
  round_number,
  week_number,
  player1_id,
  player2_id,
  player1_points,
  player2_points,
  scheduled_for,
  status,
  played_on
)
VALUES
  -- Division 1
  (1, 1, 1, 'group', NULL, 1, 1, 2, 2, 1, '2026-03-03 19:00:00', 'played',           '2026-03-03 20:20:00'),
  (2, 1, 1, 'group', NULL, 1, 3, 4, 0, 0, '2026-03-04 19:00:00', 'scheduled',        NULL),
  (3, 1, 1, 'group', NULL, 2, 1, 3, 0, 0, '2026-03-10 19:00:00', 'awaiting_report',  NULL),
  (4, 1, 1, 'group', NULL, 2, 2, 4, 0, 0, NULL,                  'created',          NULL),

  -- Division 2
  (5, 1, 2, 'group', NULL, 1, 5, 6, 2, 0, '2026-03-03 19:30:00', 'played',           '2026-03-03 20:05:00'),
  (6, 1, 2, 'group', NULL, 1, 7, 8, 0, 0, '2026-03-05 18:00:00', 'scheduled',        NULL),
  (7, 1, 2, 'group', NULL, 2, 5, 7, 0, 0, '2026-03-11 20:00:00', 'awaiting_report',  NULL),
  (8, 1, 2, 'group', NULL, 2, 6, 8, 2, 0, '2026-03-12 18:00:00', 'forfeited',        '2026-03-12 18:30:00');

-- ============================================================
-- REPLAYS
-- One parsed replay for match 1, one pending replay for match 3
-- ============================================================
INSERT INTO replays (
  id,
  match_id,
  tournament_id,
  uploaded_by,
  uploaded_at,
  r2_object_key,
  file_size_bytes,
  content_hash,
  original_filename,
  parse_status,
  parse_error
)
VALUES
  (
    1,
    1,
    1,
    1,
    '2026-03-03 20:25:00',
    'replays/spring-2026/match-1/game-1.aoe2record',
    524288,
    'seedhash-match1-game1',
    'match1_game1.aoe2record',
    'parsed',
    NULL
  ),
  (
    2,
    3,
    1,
    1,
    '2026-03-10 21:10:00',
    'replays/spring-2026/match-3/game-1.aoe2record',
    498122,
    'seedhash-match3-game1',
    'match3_game1.aoe2record',
    'pending',
    NULL
  );

-- ============================================================
-- MATCH UNITS
-- One parsed game attached to played match 1
-- ============================================================
INSERT INTO match_units (
  id,
  match_id,
  unit_index,
  replay_id,
  winner_id,
  loser_id
)
VALUES
  (1, 1, 1, 1, 1, 2);

-- ============================================================
-- MATCH VODS
-- ============================================================
INSERT INTO match_vods (
  id,
  match_id,
  url,
  added_by,
  created_at
)
VALUES
  (
    1,
    1,
    'https://www.twitch.tv/videos/123456789',
    9,
    '2026-03-04 10:00:00'
  );

COMMIT;