import type { NumericFilterKey, NumericFilters, NumericRange, SortDirection } from "./types";

export const FILTERABLE_NUMERIC_COLUMNS: Array<{
  key: NumericFilterKey;
  label: string;
}> = [
  { key: "signup_rating", label: "Signup 1v1" },
  { key: "signup_max_rating", label: "Signup Max" },
  { key: "signup_team_rating", label: "Signup Team" },
  { key: "signup_max_team_rating", label: "Signup Team Max" },
  { key: "current_rating", label: "1v1" },
  { key: "current_max_rating", label: "Max" },
  { key: "current_team_rating", label: "Team" },
  { key: "current_max_team_rating", label: "Team Max" },
  { key: "total_games", label: "Games" },
  { key: "recent_games", label: "Recent" },
];

export function emptyNumericFilters(): NumericFilters {
  return {
    signup_rating: { min: null, max: null },
    signup_max_rating: { min: null, max: null },
    signup_team_rating: { min: null, max: null },
    signup_max_team_rating: { min: null, max: null },
    current_rating: { min: null, max: null },
    current_max_rating: { min: null, max: null },
    current_team_rating: { min: null, max: null },
    current_max_team_rating: { min: null, max: null },
    total_games: { min: null, max: null },
    recent_games: { min: null, max: null },
  };
}

export function registrationStatusColor(status: string) {
  switch (status) {
    case "approved":
      return "green";
    case "rejected":
      return "red";
    case "withdrawn":
      return "gray";
    default:
      return "yellow";
  }
}

export function numberOrNull(value: number | null | undefined) {
  return typeof value === "number" ? value : null;
}

export function compareNullableNumbers(
  a: number | null | undefined,
  b: number | null | undefined,
  direction: SortDirection,
) {
  const av = numberOrNull(a);
  const bv = numberOrNull(b);

  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;

  return direction === "asc" ? av - bv : bv - av;
}

export function compareStrings(a: string, b: string, direction: SortDirection) {
  const result = a.localeCompare(b, undefined, { sensitivity: "base" });
  return direction === "asc" ? result : -result;
}

export function passesRange(value: number | null | undefined, range: NumericRange) {
  const normalized = numberOrNull(value);

  if (normalized == null) {
    return range.min == null && range.max == null;
  }

  if (range.min != null && normalized < range.min) {
    return false;
  }

  if (range.max != null && normalized > range.max) {
    return false;
  }

  return true;
}

export function hasRange(range: NumericRange) {
  return range.min != null || range.max != null;
}