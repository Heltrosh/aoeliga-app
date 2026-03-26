import type {
  TournamentSetup,
  TournamentSetupAssignment,
  TournamentSetupEligibleRegistration,
  TournamentSetupMatch,
  TournamentSetupRatingKey,
} from "../../../api/schemas/tournamentSetup";

export const SETUP_STEP_VALUES = [
  "divisions",
  "players",
  "matches",
  "review",
] as const;

export type SetupStepValue = (typeof SETUP_STEP_VALUES)[number];

export function getRegistrationName(
  registration:
    | Pick<TournamentSetupEligibleRegistration, "display_name" | "discord_name" | "aoe_name">
    | Pick<TournamentSetupAssignment, "display_name" | "discord_name" | "aoe_name">,
) {
  return registration.display_name ?? registration.discord_name ?? registration.aoe_name;
}

export function getRatingValue(
  registration: TournamentSetupEligibleRegistration | TournamentSetupAssignment,
  ratingKey: TournamentSetupRatingKey,
) {
  return registration[ratingKey] ?? null;
}

export function buildDivisionAssignmentDraft(setup: TournamentSetup) {
  const assignmentByRegistrationId = new Map(
    setup.assignments.map((assignment) => [assignment.registration_id, assignment]),
  );

  const orderedRegistrationIds =
    setup.assignments.length > 0
      ? setup.assignments.map((assignment) => assignment.registration_id)
      : setup.eligible_registrations.map((registration) => registration.registration_id);

  return orderedRegistrationIds
    .map((registrationId, index) => {
      const assignment = assignmentByRegistrationId.get(registrationId);
      return {
        registration_id: registrationId,
        setup_division_id: assignment?.setup_division_id ?? null,
        sort_order: assignment?.sort_order ?? index + 1,
      };
    })
    .filter((row) =>
      setup.eligible_registrations.some(
        (registration) => registration.registration_id === row.registration_id,
      ),
    );
}

export function buildMatchesDraft(setup: TournamentSetup) {
  return setup.matches.map((match) => ({ ...match }));
}

export function groupAssignmentsByDivision(setup: TournamentSetup) {
  const buckets = new Map<number, TournamentSetupAssignment[]>();
  for (const division of setup.divisions) {
    buckets.set(division.id, []);
  }

  for (const assignment of setup.assignments) {
    const bucket = buckets.get(assignment.setup_division_id) ?? [];
    bucket.push(assignment);
    buckets.set(assignment.setup_division_id, bucket);
  }

  for (const [divisionId, rows] of buckets.entries()) {
    rows.sort((a, b) => a.sort_order - b.sort_order || a.seed - b.seed || a.id - b.id);
    buckets.set(divisionId, rows);
  }

  return buckets;
}

export function groupMatchesByDivision(setup: TournamentSetup) {
  const buckets = new Map<number, TournamentSetupMatch[]>();
  for (const division of setup.divisions) {
    buckets.set(division.id, []);
  }

  for (const match of setup.matches) {
    const bucket = buckets.get(match.setup_division_id) ?? [];
    bucket.push(match);
    buckets.set(match.setup_division_id, bucket);
  }

  for (const [divisionId, rows] of buckets.entries()) {
    rows.sort((a, b) => {
      if (a.round_number !== b.round_number) return a.round_number - b.round_number;
      const leftWeek = a.week_number ?? Number.MAX_SAFE_INTEGER;
      const rightWeek = b.week_number ?? Number.MAX_SAFE_INTEGER;
      if (leftWeek !== rightWeek) return leftWeek - rightWeek;
      return a.id - b.id;
    });
    buckets.set(divisionId, rows);
  }

  return buckets;
}

export function formatSessionStatus(status: TournamentSetup["session"]["status"]) {
  if (status === "ready") return "ready";
  if (status === "applied") return "applied";
  return "draft";
}

export function countAssignmentsMissingDivision(
  draft: Array<{ registration_id: number; setup_division_id: number | null }>,
) {
  return draft.filter((row) => row.setup_division_id == null).length;
}
