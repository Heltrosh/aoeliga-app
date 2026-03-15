import type { RulesetMatchFormat, RulesetStage } from './schema';

export type EnginePlayer = {
  id: number;
  user_id: number;
  seed: number | null;
  status?: string | null;
  display_name: string | null;
  discord_name: string | null;
};

export type EngineMatch = {
  id: number;
  player1_id: number;
  player2_id: number;
  player1_points: number | null;
  player2_points: number | null;
  status?: string | null;
  stage: string | null;
  round_number: number | null;
  week_number: number | null;
  played_on: string | null;
};

export type GeneratedMatchPreview = {
  stage_id: string;
  stage_type: RulesetStage['type'];
  round_number: number;
  round_label: string | null;
  week_number: number | null;
  player1_id: number | null;
  player2_id: number | null;
  player1_name: string | null;
  player2_name: string | null;
  bye: boolean;
  format_id: string;
  format: RulesetMatchFormat;
};

export type StandingsRow = {
  player_id: number;
  display_name: string;
  seed: number | null;
  matches_played: number;
  match_wins: number;
  match_losses: number;
  game_wins: number;
  game_losses: number;
  game_difference: number;
  match_points: number;
  rank: number;
};
