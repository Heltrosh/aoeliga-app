export const TOURNAMENT_STATUSES = [
  "draft",
  "signup",
  "active",
  "completed",
  "archived",
] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export const TOURNAMENT_REGISTRATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "withdrawn",
] as const;
export type TournamentRegistrationStatus =
  (typeof TOURNAMENT_REGISTRATION_STATUSES)[number];

export const TOURNAMENT_PLAYER_STATUSES = [
  "active",
  "withdrawn",
  "banned",
] as const;
export type TournamentPlayerStatus =
  (typeof TOURNAMENT_PLAYER_STATUSES)[number];

export const TOURNAMENT_ROLES = ["admin", "moderator"] as const;
export type TournamentRole = (typeof TOURNAMENT_ROLES)[number];

export const MATCH_STAGES = ["group", "playoffs", "custom"] as const;
export type MatchStage = (typeof MATCH_STAGES)[number];

export const MATCH_STATUSES = [
  "created",
  "scheduled",
  "awaiting_report",
  "played",
  "forfeited",
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const REPLAY_PARSE_STATUSES = [
  "pending",
  "parsing",
  "parsed",
  "failed",
] as const;
export type ReplayParseStatus = (typeof REPLAY_PARSE_STATUSES)[number];