import { generateStagePreview } from '../domain/rulesets/engine';
import { parseRulesetOrThrow } from '../domain/rulesets/parse';
import type { Ruleset } from '../domain/rulesets/schema';
import type { EnginePlayer } from '../domain/rulesets/types';
import type {
  TournamentSetupDistributionMode,
  TournamentSetupDivisionRow,
  TournamentSetupEligibleRegistrationRow,
  TournamentSetupMatchViewRow,
  TournamentSetupPlayerAssignmentViewRow,
  TournamentSetupRatingKey,
  TournamentSetupSessionRow,
} from '../domain/tournamentSetup';
import { fetchRegistrationSnapshot } from '../lib/registration';
import { httpError } from '../lib/http';
import { getRulesetById } from '../repositories/rulesets';
import {
  countLiveTournamentState,
  createSetupSession,
  getSetupSessionByTournamentId,
  listApprovedRegistrationsForSetup,
  listSetupAssignments,
  listSetupDivisions,
  listSetupMatches,
} from '../repositories/tournamentSetup';
import type { TournamentRow } from '../domain/tournament';
import type { Context } from 'hono';
import type { AppBindings } from '../types/app';

const RATING_KEYS: readonly TournamentSetupRatingKey[] = [
  'signup_rating',
  'signup_max_rating',
  'signup_team_rating',
  'signup_max_team_rating',
  'current_rating',
  'current_max_rating',
  'current_team_rating',
  'current_max_team_rating',
] as const;

function assertSignupTournament(tournament: TournamentRow) {
  if (tournament.status !== 'signup') {
    httpError(409, 'Tournament setup is only available while the tournament is in signup state');
  }
}

function normalizeDivisionName(value: string | undefined, index: number) {
  const name = value?.trim();
  if (!name) httpError(400, `Division #${index + 1} name is required`);
  return name;
}

function assertValidRatingKey(value: string | undefined): TournamentSetupRatingKey {
  if (!value || !RATING_KEYS.includes(value as TournamentSetupRatingKey)) {
    httpError(400, 'Invalid rating key');
  }
  return value as TournamentSetupRatingKey;
}

function assertValidDistributionMode(value: string | undefined): TournamentSetupDistributionMode {
  if (value !== 'rating' && value !== 'random') {
    httpError(400, 'distribution_mode must be rating or random');
  }
  return value;
}

function compareEligibleByName(a: TournamentSetupEligibleRegistrationRow, b: TournamentSetupEligibleRegistrationRow) {
  const left = a.display_name ?? a.discord_name ?? a.aoe_name ?? '';
  const right = b.display_name ?? b.discord_name ?? b.aoe_name ?? '';
  return left.localeCompare(right) || a.registration_id - b.registration_id;
}

function shuffleStable<T>(items: T[]) {
  const values = [...items];
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

function sortEligibleRegistrations(
  rows: TournamentSetupEligibleRegistrationRow[],
  mode: TournamentSetupDistributionMode,
  ratingKey: TournamentSetupRatingKey | null,
) {
  if (mode === 'random') {
    return shuffleStable(rows);
  }

  if (!ratingKey) {
    httpError(400, 'rating_key is required when distribution_mode is rating');
  }

  return [...rows].sort((a, b) => {
    const left = a[ratingKey] ?? Number.NEGATIVE_INFINITY;
    const right = b[ratingKey] ?? Number.NEGATIVE_INFINITY;
    if (left !== right) return right - left;
    return compareEligibleByName(a, b);
  });
}

function chunkSizes(total: number, buckets: number) {
  const base = Math.floor(total / buckets);
  const remainder = total % buckets;
  return Array.from({ length: buckets }, (_, index) => base + (index < remainder ? 1 : 0));
}

function mapSetupStageToLiveStage(stageType: string, stageKey: string) {
  if (stageType === 'round_robin') return 'group';
  if (stageType === 'single_elimination') return 'playoffs';
  if (stageKey === 'group' || stageKey === 'playoffs' || stageKey === 'custom') return stageKey;
  return 'custom';
}

async function resolveRulesetForSetupDivision(
  c: Context<AppBindings>,
  tournament: TournamentRow,
  division: { ruleset_id: number | null },
): Promise<Ruleset> {
  const rulesetId = division.ruleset_id ?? tournament.default_ruleset;
  if (!rulesetId) httpError(400, 'Division does not have a ruleset and tournament has no default ruleset');

  const rulesetRow = await getRulesetById(c.env.DB, rulesetId);
  if (!rulesetRow) httpError(400, `Ruleset ${rulesetId} not found`);

  return parseRulesetOrThrow(JSON.parse(rulesetRow.config_json));
}

export async function ensureTournamentSetupSession(c: Context<AppBindings>, tournamentId: number, createdBy: number) {
  let session = await getSetupSessionByTournamentId(c.env.DB, tournamentId);
  if (session) return session;

  const sessionId = await createSetupSession(c.env.DB, { tournamentId, createdBy });
  session = await getSetupSessionByTournamentId(c.env.DB, tournamentId);
  if (!session || session.id !== sessionId) httpError(500, 'Failed to create tournament setup session');
  return session;
}

export async function getTournamentSetupDto(c: Context<AppBindings>, tournament: TournamentRow, createdBy: number) {
  const session = await ensureTournamentSetupSession(c, tournament.id, createdBy);
  const [divisions, assignments, matches, eligibleRegistrations] = await Promise.all([
    listSetupDivisions(c.env.DB, session.id),
    listSetupAssignments(c.env.DB, session.id),
    listSetupMatches(c.env.DB, session.id),
    listApprovedRegistrationsForSetup(c.env.DB, tournament.id),
  ]);

  return {
    session,
    divisions,
    assignments,
    matches,
    eligible_registrations: eligibleRegistrations,
  };
}

export async function replaceTournamentSetupDivisions(
  c: Context<AppBindings>,
  tournament: TournamentRow,
  createdBy: number,
  divisions: Array<{ name?: string; ruleset_id?: number | null }>,
) {
  assertSignupTournament(tournament);
  if (!Array.isArray(divisions) || divisions.length === 0) {
    httpError(400, 'At least one division is required');
  }

  const normalized = divisions.map((division, index) => ({
    name: normalizeDivisionName(division.name, index),
    ruleset_id: division.ruleset_id ?? null,
    sort_order: index + 1,
  }));

  const uniqueNames = new Set(normalized.map((entry) => entry.name.toLowerCase()));
  if (uniqueNames.size !== normalized.length) {
    httpError(400, 'Division names must be unique');
  }

  for (const division of normalized) {
    if (division.ruleset_id != null) {
      const ruleset = await getRulesetById(c.env.DB, division.ruleset_id);
      if (!ruleset) httpError(400, `Ruleset ${division.ruleset_id} not found`);
    }
  }

  const session = await ensureTournamentSetupSession(c, tournament.id, createdBy);

  const statements = [
    c.env.DB.prepare(
      `DELETE FROM tournament_setup_divisions WHERE setup_session_id = ?`,
    ).bind(session.id),

    ...normalized.map((division) =>
      c.env.DB.prepare(
        `INSERT INTO tournament_setup_divisions (setup_session_id, name, ruleset_id, sort_order)
         VALUES (?, ?, ?, ?)`,
      ).bind(session.id, division.name, division.ruleset_id, division.sort_order),
    ),

    c.env.DB.prepare(
      `UPDATE tournament_setup_sessions
       SET status = 'draft', updated_at = datetime('now')
       WHERE id = ?`,
    ).bind(session.id),
  ];

  await c.env.DB.batch(statements);

  return getTournamentSetupDto(c, tournament, createdBy);
}

export async function generateTournamentSetupAssignments(
  c: Context<AppBindings>,
  tournament: TournamentRow,
  createdBy: number,
  input: { distribution_mode?: string; rating_key?: string },
) {
  assertSignupTournament(tournament);
  const session = await ensureTournamentSetupSession(c, tournament.id, createdBy);
  const divisions = await listSetupDivisions(c.env.DB, session.id);
  if (divisions.length === 0) httpError(409, 'Create setup divisions before generating player assignments');

  const eligible = await listApprovedRegistrationsForSetup(c.env.DB, tournament.id);
  if (eligible.length === 0) httpError(409, 'There are no approved registrations to assign');

  const mode = assertValidDistributionMode(input.distribution_mode);
  const ratingKey = mode === 'rating' ? assertValidRatingKey(input.rating_key) : null;
  const ordered = sortEligibleRegistrations(eligible, mode, ratingKey);
  const sizes = chunkSizes(ordered.length, divisions.length);

   let offset = 0;
  const statements = [
    c.env.DB.prepare(
      `DELETE FROM tournament_setup_player_assignments WHERE setup_session_id = ?`,
    ).bind(session.id),
    c.env.DB.prepare(
      `DELETE FROM tournament_setup_matches WHERE setup_session_id = ?`,
    ).bind(session.id),
  ];

  for (let divisionIndex = 0; divisionIndex < divisions.length; divisionIndex += 1) {
    const division = divisions[divisionIndex];
    const size = sizes[divisionIndex];
    const assignedRows = ordered.slice(offset, offset + size);
    offset += size;

    for (let index = 0; index < assignedRows.length; index += 1) {
      const row = assignedRows[index];
      const sourceRatingValue = ratingKey ? row[ratingKey] ?? null : null;

      statements.push(
        c.env.DB.prepare(
          `INSERT INTO tournament_setup_player_assignments (
             setup_session_id,
             setup_division_id,
             registration_id,
             seed,
             sort_order,
             source_rating_value
           ) VALUES (?, ?, ?, ?, ?, ?)`,
        ).bind(
          session.id,
          division.id,
          row.registration_id,
          index + 1,
          index + 1,
          sourceRatingValue,
        ),
      );
    }
  }

  statements.push(
    c.env.DB.prepare(
      `UPDATE tournament_setup_sessions
       SET distribution_mode = ?,
           selected_rating_key = ?,
           status = 'draft',
           updated_at = datetime('now')
       WHERE id = ?`,
    ).bind(mode, ratingKey, session.id),
  );

  await c.env.DB.batch(statements);

  return getTournamentSetupDto(c, tournament, createdBy);
}

export async function replaceTournamentSetupAssignments(
  c: Context<AppBindings>,
  tournament: TournamentRow,
  createdBy: number,
  assignments: Array<{ registration_id?: number; setup_division_id?: number; sort_order?: number | null }>,
) {
  assertSignupTournament(tournament);
  const session = await ensureTournamentSetupSession(c, tournament.id, createdBy);
  const [eligible, divisions] = await Promise.all([
    listApprovedRegistrationsForSetup(c.env.DB, tournament.id),
    listSetupDivisions(c.env.DB, session.id),
  ]);

  if (divisions.length === 0) httpError(409, 'Create setup divisions before assigning players');
  if (eligible.length === 0) httpError(409, 'There are no approved registrations to assign');
  if (!Array.isArray(assignments) || assignments.length !== eligible.length) {
    httpError(400, 'Assignments must include each approved registration exactly once');
  }

  const eligibleMap = new Map(eligible.map((row) => [row.registration_id, row]));
  const divisionIds = new Set(divisions.map((row) => row.id));
  const grouped = new Map<number, Array<{ registration_id: number; sort_order: number }>>();
  const seen = new Set<number>();

  assignments.forEach((assignment, index) => {
    const registrationId = Number(assignment.registration_id);
    const setupDivisionId = Number(assignment.setup_division_id);
    if (!Number.isInteger(registrationId) || !eligibleMap.has(registrationId)) {
      httpError(400, `Invalid registration_id at assignments[${index}]`);
    }
    if (!Number.isInteger(setupDivisionId) || !divisionIds.has(setupDivisionId)) {
      httpError(400, `Invalid setup_division_id at assignments[${index}]`);
    }
    if (seen.has(registrationId)) {
      httpError(400, 'Each approved registration must appear only once in assignments');
    }
    seen.add(registrationId);

    const sortOrder = Number.isInteger(assignment.sort_order) ? Number(assignment.sort_order) : index + 1;
    const bucket = grouped.get(setupDivisionId) ?? [];
    bucket.push({ registration_id: registrationId, sort_order: sortOrder });
    grouped.set(setupDivisionId, bucket);
  });

  const statements = [
    c.env.DB.prepare(
      `DELETE FROM tournament_setup_player_assignments WHERE setup_session_id = ?`,
    ).bind(session.id),
    c.env.DB.prepare(
      `DELETE FROM tournament_setup_matches WHERE setup_session_id = ?`,
    ).bind(session.id),
  ];

  for (const division of divisions) {
    const bucket = (grouped.get(division.id) ?? []).sort(
      (a, b) => a.sort_order - b.sort_order || a.registration_id - b.registration_id,
    );

    for (let index = 0; index < bucket.length; index += 1) {
      const row = bucket[index];

      statements.push(
        c.env.DB.prepare(
          `INSERT INTO tournament_setup_player_assignments (
             setup_session_id,
             setup_division_id,
             registration_id,
             seed,
             sort_order,
             source_rating_value
           ) VALUES (?, ?, ?, ?, ?, ?)`,
        ).bind(session.id, division.id, row.registration_id, index + 1, index + 1, null),
      );
    }
  }

  statements.push(
    c.env.DB.prepare(
      `UPDATE tournament_setup_sessions
       SET status = 'draft', updated_at = datetime('now')
       WHERE id = ?`,
    ).bind(session.id),
  );

  await c.env.DB.batch(statements);

  return getTournamentSetupDto(c, tournament, createdBy);
}

export async function generateTournamentSetupMatches(
  c: Context<AppBindings>,
  tournament: TournamentRow,
  createdBy: number,
) {
  assertSignupTournament(tournament);
  const session = await ensureTournamentSetupSession(c, tournament.id, createdBy);
  const [divisions, assignments] = await Promise.all([
    listSetupDivisions(c.env.DB, session.id),
    listSetupAssignments(c.env.DB, session.id),
  ]);

  if (divisions.length === 0) httpError(409, 'Create setup divisions before generating matches');
  if (assignments.length === 0) httpError(409, 'Generate or assign players before generating matches');

  const assignmentsByDivision = new Map<number, TournamentSetupPlayerAssignmentViewRow[]>();
  for (const assignment of assignments) {
    const bucket = assignmentsByDivision.get(assignment.setup_division_id) ?? [];
    bucket.push(assignment);
    assignmentsByDivision.set(assignment.setup_division_id, bucket);
  }

    const statements = [
    c.env.DB.prepare(
      `DELETE FROM tournament_setup_matches WHERE setup_session_id = ?`,
    ).bind(session.id),
  ];

  for (const division of divisions) {
    const divisionAssignments = (assignmentsByDivision.get(division.id) ?? []).sort(
      (a, b) => a.seed - b.seed || a.sort_order - b.sort_order,
    );

    if (divisionAssignments.length < 2) {
      continue;
    }

    const ruleset = await resolveRulesetForSetupDivision(c, tournament, division);
    const firstStage = ruleset.stages[0];
    if (!firstStage) {
      httpError(400, `Ruleset for division ${division.name} does not define any stages`);
    }

    const players: EnginePlayer[] = divisionAssignments.map((assignment) => ({
      id: assignment.registration_id,
      user_id: assignment.user_id,
      seed: assignment.seed,
      status: 'active',
      display_name: assignment.display_name ?? assignment.aoe_name,
      discord_name: assignment.discord_name,
    }));

    const previewMatches = generateStagePreview(ruleset, firstStage.id, players);

    for (const preview of previewMatches) {
      statements.push(
        c.env.DB.prepare(
          `INSERT INTO tournament_setup_matches (
             setup_session_id,
             setup_division_id,
             stage_key,
             stage_type,
             round_number,
             round_label,
             week_number,
             format_id,
             player1_registration_id,
             player2_registration_id
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          session.id,
          division.id,
          firstStage.id,
          firstStage.type,
          preview.round_number,
          preview.round_label ?? null,
          preview.week_number ?? null,
          preview.format_id,
          preview.player1_id ?? null,
          preview.player2_id ?? null,
        ),
      );
    }
  }

  statements.push(
    c.env.DB.prepare(
      `UPDATE tournament_setup_sessions
       SET status = 'ready', updated_at = datetime('now')
       WHERE id = ?`,
    ).bind(session.id),
  );

  await c.env.DB.batch(statements);

  return getTournamentSetupDto(c, tournament, createdBy);
}

export async function replaceTournamentSetupMatches(
  c: Context<AppBindings>,
  tournament: TournamentRow,
  createdBy: number,
  matches: Array<{
    setup_division_id?: number;
    stage_key?: string;
    stage_type?: string;
    round_number?: number;
    round_label?: string | null;
    week_number?: number | null;
    format_id?: string;
    player1_registration_id?: number | null;
    player2_registration_id?: number | null;
  }>,
) {
  assertSignupTournament(tournament);
  const session = await ensureTournamentSetupSession(c, tournament.id, createdBy);
  const [divisions, assignments] = await Promise.all([
    listSetupDivisions(c.env.DB, session.id),
    listSetupAssignments(c.env.DB, session.id),
  ]);

  const divisionIds = new Set(divisions.map((row) => row.id));
  const assignmentMap = new Map(assignments.map((row) => [row.registration_id, row]));
  const pairKeys = new Set<string>();

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const setupDivisionId = Number(match.setup_division_id);
    if (!Number.isInteger(setupDivisionId) || !divisionIds.has(setupDivisionId)) {
      httpError(400, `Invalid setup_division_id at matches[${index}]`);
    }
    if (!match.stage_key?.trim()) httpError(400, `stage_key is required at matches[${index}]`);
    if (!match.stage_type?.trim()) httpError(400, `stage_type is required at matches[${index}]`);
    if (!match.format_id?.trim()) httpError(400, `format_id is required at matches[${index}]`);
    if (!Number.isInteger(match.round_number) || Number(match.round_number) <= 0) {
      httpError(400, `round_number must be a positive integer at matches[${index}]`);
    }

    const p1 = match.player1_registration_id == null ? null : Number(match.player1_registration_id);
    const p2 = match.player2_registration_id == null ? null : Number(match.player2_registration_id);

    if (p1 != null) {
      const assignment = assignmentMap.get(p1);
      if (!assignment || assignment.setup_division_id !== setupDivisionId) {
        httpError(400, `player1_registration_id must belong to the selected setup division at matches[${index}]`);
      }
    }

    if (p2 != null) {
      const assignment = assignmentMap.get(p2);
      if (!assignment || assignment.setup_division_id !== setupDivisionId) {
        httpError(400, `player2_registration_id must belong to the selected setup division at matches[${index}]`);
      }
    }

    if (p1 != null && p2 != null) {
      if (p1 === p2) httpError(400, `A setup match cannot pair the same player twice at matches[${index}]`);
      const key = [setupDivisionId, match.stage_key.trim(), Math.min(p1, p2), Math.max(p1, p2)].join(':');
      if (pairKeys.has(key)) {
        httpError(400, `Duplicate match pairing detected at matches[${index}]`);
      }
      pairKeys.add(key);
    }
  }

  const statements = [
    c.env.DB.prepare(
      `DELETE FROM tournament_setup_matches WHERE setup_session_id = ?`,
    ).bind(session.id),
  ];

  for (const match of matches) {
    statements.push(
      c.env.DB.prepare(
        `INSERT INTO tournament_setup_matches (
           setup_session_id,
           setup_division_id,
           stage_key,
           stage_type,
           round_number,
           round_label,
           week_number,
           format_id,
           player1_registration_id,
           player2_registration_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        session.id,
        Number(match.setup_division_id),
        match.stage_key!.trim(),
        match.stage_type!.trim(),
        Number(match.round_number),
        match.round_label ?? null,
        match.week_number ?? null,
        match.format_id!.trim(),
        match.player1_registration_id ?? null,
        match.player2_registration_id ?? null,
      ),
    );
  }

  statements.push(
    c.env.DB.prepare(
      `UPDATE tournament_setup_sessions
       SET status = 'ready', updated_at = datetime('now')
       WHERE id = ?`,
    ).bind(session.id),
  );

  await c.env.DB.batch(statements);

  return getTournamentSetupDto(c, tournament, createdBy);
}

function assertSetupReadyForApply(
  tournament: TournamentRow,
  session: TournamentSetupSessionRow,
  divisions: TournamentSetupDivisionRow[],
  assignments: TournamentSetupPlayerAssignmentViewRow[],
  matches: TournamentSetupMatchViewRow[],
  eligibleRegistrations: TournamentSetupEligibleRegistrationRow[],
) {
  assertSignupTournament(tournament);
  if (divisions.length === 0) httpError(409, 'Tournament setup has no divisions');
  if (assignments.length !== eligibleRegistrations.length) {
    httpError(409, 'Tournament setup does not assign every approved registration');
  }
  if (matches.length === 0) httpError(409, 'Tournament setup has no generated matches');

  const divisionIds = new Set(divisions.map((row) => row.id));
  const assignedPerDivision = new Map<number, number>();
  for (const assignment of assignments) {
    if (!divisionIds.has(assignment.setup_division_id)) {
      httpError(409, 'Tournament setup contains assignments for an unknown setup division');
    }
    assignedPerDivision.set(assignment.setup_division_id, (assignedPerDivision.get(assignment.setup_division_id) ?? 0) + 1);
  }

  for (const division of divisions) {
    if ((assignedPerDivision.get(division.id) ?? 0) === 0) {
      httpError(409, `Setup division ${division.name} does not contain any assigned players`);
    }
  }

  if (session.status !== 'ready') {
    httpError(409, 'Tournament setup must have generated matches before it can be applied');
  }
}

export async function applyTournamentSetup(
  c: Context<AppBindings>,
  tournament: TournamentRow,
  createdBy: number,
) {
  assertSignupTournament(tournament);
  const session = await ensureTournamentSetupSession(c, tournament.id, createdBy);
  const [divisions, assignments, matches, eligibleRegistrations, liveState] = await Promise.all([
    listSetupDivisions(c.env.DB, session.id),
    listSetupAssignments(c.env.DB, session.id),
    listSetupMatches(c.env.DB, session.id),
    listApprovedRegistrationsForSetup(c.env.DB, tournament.id),
    countLiveTournamentState(c.env.DB, tournament.id),
  ]);

  assertSetupReadyForApply(tournament, session, divisions, assignments, matches, eligibleRegistrations);

  if (liveState.playerCount > 0 || liveState.matchCount > 0) {
    httpError(409, 'Tournament already has live players or matches and cannot be activated through setup');
  }

  const uniqueAoeIds = new Set(eligibleRegistrations.map((row) => row.aoe_id));
  if (uniqueAoeIds.size !== eligibleRegistrations.length) {
    httpError(409, 'Approved registrations must have unique AoE ids before activation');
  }

  const activationSnapshots = new Map<string, Awaited<ReturnType<typeof fetchRegistrationSnapshot>>>();
  for (const registration of eligibleRegistrations) {
    const snapshot = await fetchRegistrationSnapshot(
      `https://www.aoe2companion.com/players/${registration.aoe_id}`,
      tournament.recent_games_days ?? 30,
    );
    activationSnapshots.set(String(registration.registration_id), snapshot);
  }

  const registrationsById = new Map(
    eligibleRegistrations.map((row) => [row.registration_id, row]),
  );

  // D1 in Workers does not allow manual SQL BEGIN/COMMIT.
  // All validations above run before the first mutation, then writes happen
  // in deterministic order so activation can still complete safely.
  await c.env.DB.prepare(
    `DELETE FROM divisions WHERE tournament_id = ?`,
  ).bind(tournament.id).run();

  const liveDivisionIdBySetupDivisionId = new Map<number, number>();
  for (const division of divisions) {
    const result = await c.env.DB.prepare(
      `INSERT INTO divisions (tournament_id, name, ruleset_id)
       VALUES (?, ?, ?)`,
    ).bind(tournament.id, division.name, division.ruleset_id ?? null).run();

    liveDivisionIdBySetupDivisionId.set(division.id, Number(result.meta.last_row_id));
  }

  const livePlayerIdByRegistrationId = new Map<number, number>();

  const orderedAssignments = [...assignments].sort(
    (a, b) =>
      a.division_sort_order - b.division_sort_order ||
      a.seed - b.seed ||
      a.registration_id - b.registration_id,
  );

  for (const assignment of orderedAssignments) {
    const registration = registrationsById.get(assignment.registration_id);
    if (!registration) {
      httpError(500, 'Failed to resolve approved registration during tournament activation');
    }

    const divisionId = liveDivisionIdBySetupDivisionId.get(assignment.setup_division_id);
    if (!divisionId) {
      httpError(500, 'Failed to resolve live division during tournament activation');
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO tournament_players (
         tournament_id,
         user_id,
         registration_id,
         division_id,
         aoe_id,
         seed,
         status,
         joined_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'))`,
    ).bind(
      tournament.id,
      registration.user_id,
      registration.registration_id,
      divisionId,
      registration.aoe_id,
      assignment.seed,
    ).run();

    const playerId = Number(result.meta.last_row_id);
    livePlayerIdByRegistrationId.set(registration.registration_id, playerId);

    const activation = activationSnapshots.get(String(registration.registration_id));
    if (!activation) {
      httpError(500, 'Missing activation snapshot during tournament activation');
    }

    await c.env.DB.prepare(
      `UPDATE player_statistics
       SET player_id = ?,
           activation_rating = ?,
           activation_max_rating = ?,
           activation_team_rating = ?,
           activation_max_team_rating = ?,
           total_games = ?,
           recent_games = ?,
           current_data_fetched_at = datetime('now')
       WHERE registration_id = ?`,
    ).bind(
      playerId,
      activation.currentRating,
      activation.currentMaxRating,
      activation.currentTeamRating,
      activation.currentTeamMaxRating,
      activation.totalGames,
      activation.recentGames,
      registration.registration_id,
    ).run();
  }

  for (const match of matches) {
    const divisionId = liveDivisionIdBySetupDivisionId.get(match.setup_division_id);
    if (!divisionId) {
      httpError(500, 'Failed to resolve live division for a generated setup match');
    }

    const player1Id =
      match.player1_registration_id == null
        ? null
        : livePlayerIdByRegistrationId.get(match.player1_registration_id) ?? null;

    const player2Id =
      match.player2_registration_id == null
        ? null
        : livePlayerIdByRegistrationId.get(match.player2_registration_id) ?? null;

    if (!player1Id || !player2Id) {
      httpError(409, 'Generated setup matches with byes cannot be applied yet');
    }

    await c.env.DB.prepare(
      `INSERT INTO matches (
         tournament_id,
         division_id,
         stage,
         round_number,
         week_number,
         player1_id,
         player2_id,
         player1_points,
         player2_points,
         status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 'created')`,
    ).bind(
      tournament.id,
      divisionId,
      mapSetupStageToLiveStage(match.stage_type, match.stage_key),
      match.round_number,
      match.week_number,
      player1Id,
      player2Id,
    ).run();
  }

  await c.env.DB.prepare(
    `UPDATE tournaments
     SET status = 'active', registrations_open = 0
     WHERE id = ?`,
  ).bind(tournament.id).run();

  await c.env.DB.prepare(
    `UPDATE tournament_setup_sessions
     SET status = 'applied', applied_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ?`,
  ).bind(session.id).run();

  return getTournamentSetupDto(c, { ...tournament, status: 'active', registrations_open: 0 } as TournamentRow, createdBy);
}
