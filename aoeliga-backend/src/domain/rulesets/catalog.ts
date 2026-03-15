export const RULESET_STAGE_TYPES = [
  'round_robin',
  'single_elimination',
  'double_elimination',
] as const;

export const RULESET_PARTICIPANT_SOURCES = [
  'division_players',
  'previous_stage',
] as const;

export const RULESET_MATCH_FORMAT_TYPES = ['best_of', 'play_all'] as const;

export const RULESET_SCORING_TYPES = ['match_points', 'game_points', 'hybrid'] as const;

export const RULESET_ADVANCEMENT_TYPES = ['top_n', 'all'] as const;

export const RULESET_TIEBREAKERS = [
  'match_points',
  'head_to_head',
  'game_difference',
  'games_won',
  'seed',
] as const;

export const RULESET_ROUND_LABELS = [
  'round_of_128',
  'round_of_64',
  'round_of_32',
  'round_of_16',
  'quarterfinal',
  'semifinal',
  'final',
  'grand_final',
] as const;

export function getRulesetCatalog() {
  return {
    version: 1,
    stage_types: [...RULESET_STAGE_TYPES],
    participant_sources: [...RULESET_PARTICIPANT_SOURCES],
    match_format_types: [...RULESET_MATCH_FORMAT_TYPES],
    scoring_types: [...RULESET_SCORING_TYPES],
    advancement_types: [...RULESET_ADVANCEMENT_TYPES],
    tiebreakers: [...RULESET_TIEBREAKERS],
    round_labels: [...RULESET_ROUND_LABELS],
    examples: {
      formats: [
        { id: 'bo3', type: 'best_of', games: 3 },
        { id: 'bo5', type: 'best_of', games: 5 },
        { id: 'pa3', type: 'play_all', games: 3 },
      ],
      scoring: [
        { id: 'league_points', type: 'match_points', win: 3, loss: 0, draw: 0 },
        { id: 'game_points', type: 'game_points', per_game_win: 1, per_game_loss: 0 },
      ],
    },
  };
}
