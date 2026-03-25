export const TOURNAMENT_SETUP_SESSION_STATUSES = [
  'draft',
  'ready',
  'applied',
] as const;
export type TournamentSetupSessionStatus = (typeof TOURNAMENT_SETUP_SESSION_STATUSES)[number];

export const TOURNAMENT_SETUP_DISTRIBUTION_MODES = ['rating', 'random'] as const;
export type TournamentSetupDistributionMode = (typeof TOURNAMENT_SETUP_DISTRIBUTION_MODES)[number];

export const TOURNAMENT_SETUP_RATING_KEYS = [
  'signup_rating',
  'signup_max_rating',
  'signup_team_rating',
  'signup_max_team_rating',
  'current_rating',
  'current_max_rating',
  'current_team_rating',
  'current_max_team_rating',
] as const;
export type TournamentSetupRatingKey = (typeof TOURNAMENT_SETUP_RATING_KEYS)[number];

export type TournamentSetupSessionRow = {
  id: number;
  tournament_id: number;
  status: TournamentSetupSessionStatus;
  distribution_mode: TournamentSetupDistributionMode | null;
  selected_rating_key: TournamentSetupRatingKey | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  applied_at: string | null;
};

export type TournamentSetupDivisionRow = {
  id: number;
  setup_session_id: number;
  name: string;
  ruleset_id: number | null;
  sort_order: number;
};

export type TournamentSetupEligibleRegistrationRow = {
  registration_id: number;
  user_id: number;
  aoe_id: string;
  aoe_name: string;
  display_name: string | null;
  discord_name: string | null;
  avatar: string | null;
  signup_rating: number | null;
  signup_max_rating: number | null;
  signup_team_rating: number | null;
  signup_max_team_rating: number | null;
  current_rating: number | null;
  current_max_rating: number | null;
  current_team_rating: number | null;
  current_max_team_rating: number | null;
  total_games: number | null;
  recent_games: number | null;
  current_data_fetched_at: string | null;
};

export type TournamentSetupPlayerAssignmentRow = {
  id: number;
  setup_session_id: number;
  setup_division_id: number;
  registration_id: number;
  seed: number;
  sort_order: number;
  source_rating_value: number | null;
};

export type TournamentSetupPlayerAssignmentViewRow = TournamentSetupPlayerAssignmentRow &
  TournamentSetupEligibleRegistrationRow & {
    division_name: string;
    division_sort_order: number;
  };

export type TournamentSetupMatchRow = {
  id: number;
  setup_session_id: number;
  setup_division_id: number;
  stage_key: string;
  stage_type: string;
  round_number: number;
  round_label: string | null;
  week_number: number | null;
  format_id: string;
  player1_registration_id: number | null;
  player2_registration_id: number | null;
};

export type TournamentSetupMatchViewRow = TournamentSetupMatchRow & {
  division_name: string;
  division_sort_order: number;
  player1_name: string | null;
  player2_name: string | null;
};
