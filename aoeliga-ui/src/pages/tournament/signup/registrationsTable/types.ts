export type SortKey =
  | "user"
  | "aoe"
  | "signup_rating"
  | "signup_max_rating"
  | "signup_team_rating"
  | "signup_max_team_rating"
  | "current_rating"
  | "current_max_rating"
  | "current_team_rating"
  | "current_max_team_rating"
  | "total_games"
  | "recent_games"
  | "status";

export type SortDirection = "asc" | "desc";

export type NumericFilterKey =
  | "signup_rating"
  | "signup_max_rating"
  | "signup_team_rating"
  | "signup_max_team_rating"
  | "current_rating"
  | "current_max_rating"
  | "current_team_rating"
  | "current_max_team_rating"
  | "total_games"
  | "recent_games";

export type NumericRange = {
  min: number | null;
  max: number | null;
};

export type NumericFilters = Record<NumericFilterKey, NumericRange>;