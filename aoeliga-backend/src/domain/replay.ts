export const REPLAY_VALIDATION_STATUSES = [
  'pending',
  'valid',
  'review_required',
] as const;
export type ReplayValidationStatus = (typeof REPLAY_VALIDATION_STATUSES)[number];

export type ReplayRow = {
  id: number;
  match_unit_id: number;
  uploaded_by: number | null;
  uploaded_at: string;
  r2_object_key: string;
  original_filename: string | null;
  file_size_bytes: number;
  file_sha1: string;
  parse_status: 'pending' | 'parsing' | 'parsed' | 'failed';
  parse_started_at: string | null;
  parsed_at: string | null;
  parse_error: string | null;
  validation_status: ReplayValidationStatus;
  validation_completed_at: string | null;
  review_reason: string | null;
  valid_replay: number | null;
  completed: number | null;
  duration: number | null;
  played_at: number | null;
  map_name: string | null;
  map_dimension: number | null;
  diplomacy_type: string | null;
  team_size: string | null;
  speed: string | null;
  cheats: number | null;
  hidden_civs: number | null;
  map_reveal: string | null;
  starting_resources: string | null;
  starting_age: string | null;
  victory_condition: string | null;
  team_together: number | null;
  lock_teams: number | null;
  lock_speed: number | null;
  all_technologies: number | null;
  platform_id: string | null;
  platform_match_id: string | null;
  rated: number | null;
  lobby_name: string | null;
  allow_specs: number | null;
  private: number | null;
  spec_delay: number | null;
};

export type ReplayPlayerRow = {
  id: number;
  replay_id: number;
  player_number: number;
  name: string | null;
  profile_id: string | null;
  civilization_id: number | null;
  civilization_name: string | null;
  winner: number | null;
  matched_tournament_player_id: number | null;
};

export type MatchUnitContextRow = {
  id: number;
  match_id: number;
  unit_index: number;
  tournament_id: number;
  player1_id: number;
  player2_id: number;
  player1_user_id: number;
  player2_user_id: number;
  player1_aoe_id: string | null;
  player2_aoe_id: string | null;
};

export type ReplayContextRow = ReplayRow & {
  tournament_id: number;
  match_id: number;
  unit_index: number;
};

export type ParserPlayer = {
  number: number | null;
  name: string | null;
  profile_id: number | null;
  civilization_id: number | null;
  civilization_name: string | null;
  winner: boolean | null;
};

export type ParserReplayResponse = {
  ok: boolean;
  valid_replay: boolean;
  file_sha1: string;
  completed: boolean | null;
  duration: number | null;
  played_at: number | null;
  players: ParserPlayer[];
  map: {
    name: string | null;
    dimension: number | null;
  } | null;
  settings: {
    diplomacy_type: string | null;
    team_size: string | null;
    speed: string | null;
    cheats: boolean | null;
    hidden_civs: boolean | null;
    map_reveal: string | null;
    starting_resources: string | null;
    starting_age: string | null;
    victory_condition: string | null;
    team_together: boolean | null;
    lock_teams: boolean | null;
    lock_speed: boolean | null;
    all_technologies: boolean | null;
  } | null;
  platform: {
    platform_id: string | null;
    platform_match_id: string | null;
    rated: boolean | null;
    lobby_name: string | null;
    allow_specs: boolean | null;
    private: boolean | null;
    spec_delay: number | null;
  } | null;
};
