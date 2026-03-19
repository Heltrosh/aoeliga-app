export type RegistrationColumnKey =
  | "user"
  | "aoe"
  | "signup_rating"
  | "current_rating"
  | "current_max_rating"
  | "current_team_rating"
  | "current_max_team_rating"
  | "total_games"
  | "recent_games"
  | "status"
  | "actions"
  | "signup_max_rating"
  | "signup_team_rating"
  | "signup_max_team_rating";

export const DEFAULT_COLUMNS: RegistrationColumnKey[] = [
  "user",
  "aoe",
  "signup_rating",
  "current_rating",
  "current_max_rating",
  "current_team_rating",
  "current_max_team_rating",
  "total_games",
  "recent_games",
  "status",
  "actions",
];

export const OPTIONAL_COLUMNS: {
  key: RegistrationColumnKey;
  label: string;
}[] = [
  { key: "signup_max_rating", label: "Signup Max" },
  { key: "signup_team_rating", label: "Signup Team" },
  { key: "signup_max_team_rating", label: "Signup Team Max" },
];