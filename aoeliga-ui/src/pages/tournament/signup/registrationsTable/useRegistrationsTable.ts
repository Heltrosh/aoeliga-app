import { useMemo, useState } from "react";

import type { StaffTournamentRegistration } from "../../../../api/schemas/tournaments";
import type { NumericFilterKey, NumericFilters, SortDirection, SortKey } from "./types";
import {
  compareNullableNumbers,
  compareStrings,
  emptyNumericFilters,
  hasRange,
  passesRange,
  FILTERABLE_NUMERIC_COLUMNS,
} from "./helpers";

export function useRegistrationsTable(registrations: StaffTournamentRegistration[]) {
  const [sortKey, setSortKey] = useState<SortKey>("current_rating");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [numericFilters, setNumericFilters] = useState<NumericFilters>(emptyNumericFilters);

  const filteredAndSortedRegistrations = useMemo(() => {
    const filtered = registrations.filter((item) => {
      if (statusFilter.length > 0 && !statusFilter.includes(item.status)) {
        return false;
      }

      for (const { key } of FILTERABLE_NUMERIC_COLUMNS) {
        if (!passesRange(item[key], numericFilters[key])) {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "user": {
          const aName = (a.user.display_name || a.user.discord_name || "").trim();
          const bName = (b.user.display_name || b.user.discord_name || "").trim();
          return compareStrings(aName, bName, sortDirection);
        }
        case "aoe":
          return compareStrings(a.aoe_name, b.aoe_name, sortDirection);
        case "status":
          return compareStrings(a.status, b.status, sortDirection);
        case "signup_rating":
        case "signup_max_rating":
        case "signup_team_rating":
        case "signup_max_team_rating":
        case "current_rating":
        case "current_max_rating":
        case "current_team_rating":
        case "current_max_team_rating":
        case "total_games":
        case "recent_games":
          return compareNullableNumbers(a[sortKey], b[sortKey], sortDirection);
        default:
          return 0;
      }
    });
  }, [registrations, numericFilters, sortDirection, sortKey, statusFilter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection(
      key === "user" || key === "aoe" || key === "status" ? "asc" : "desc",
    );
  };

  const updateNumericFilter = (
    key: NumericFilterKey,
    side: "min" | "max",
    value: string | number,
  ) => {
    const normalized = typeof value === "number" ? value : null;

    setNumericFilters((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [side]: normalized,
      },
    }));
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setNumericFilters(emptyNumericFilters());
  };

  const hasAnyFilters =
    statusFilter.length > 0 ||
    Object.values(numericFilters).some((range) => hasRange(range));

  return {
    sortKey,
    sortDirection,
    statusFilter,
    numericFilters,
    filteredAndSortedRegistrations,
    hasAnyFilters,
    toggleSort,
    updateNumericFilter,
    setStatusFilter,
    clearFilters,
  };
}