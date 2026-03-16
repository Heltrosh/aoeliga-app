import { httpError } from '../lib/http';
import { getRulesetCatalog } from '../domain/rulesets/catalog';
import { parseRulesetOrThrow, safeParseRuleset } from '../domain/rulesets/parse';
import { generateStagePreview, previewMatchFormat, getStageById } from '../domain/rulesets/engine';
import { calculateStandings } from '../domain/rulesets/scoring/standings';
import type { Ruleset } from '../domain/rulesets/schema';
import { createRuleset, deleteRuleset, getDivisionRulesetRow, getRulesetById, listRulesetDivisions, listRulesetTournamentDefaults, listRulesets, updateRuleset, type RulesetRow } from '../repositories/rulesets';
import { getDivisionPlayers } from '../repositories/players';
import { getDivisionMatches } from '../repositories/matches';
import type { Env } from '../types/env';

type RulesetRequester = {
  requesterUserId: number | null;
  isGlobalAdmin: boolean;
};

function parseConfigJsonOrThrow(configJson: string): Ruleset {
  let parsed: unknown;
  try {
    parsed = JSON.parse(configJson);
  } catch {
    httpError(400, 'ruleset config_json is not valid JSON');
  }
  return parseRulesetOrThrow(parsed);
}

function buildRulesetSummary(ruleset: Ruleset) {
  return {
    version: ruleset.version,
    stage_count: ruleset.stages.length,
    stages: ruleset.stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      type: stage.type,
      default_format: stage.match_format_policy.default_format,
      scoring_system: stage.scoring?.system ?? null,
    })),
  };
}

function buildUsageCounts(row: RulesetRow) {
  const tournamentDefaultCount = Number(row.tournament_default_count ?? 0);
  const divisionCount = Number(row.division_count ?? 0);

  return {
    tournament_default_count: tournamentDefaultCount,
    division_count: divisionCount,
    is_in_use: tournamentDefaultCount > 0 || divisionCount > 0,
  };
}

function buildLifecycle(row: RulesetRow, requester: RulesetRequester) {
  const usage = buildUsageCounts(row);
  const isOwner = requester.requesterUserId != null && row.created_by_user_id === requester.requesterUserId;
  const canManageByRole = requester.isGlobalAdmin || isOwner;

  let lockReason: string | null = null;

  if (!canManageByRole) {
    lockReason = 'Only the ruleset owner or a global admin can edit or delete this ruleset.';
  } else if (usage.tournament_default_count > 0 && usage.division_count > 0) {
    lockReason = 'This ruleset is currently used as a tournament default and by one or more divisions.';
  } else if (usage.tournament_default_count > 0) {
    lockReason = 'This ruleset is currently used as a tournament default.';
  } else if (usage.division_count > 0) {
    lockReason = 'This ruleset is currently assigned to one or more divisions.';
  }

  return {
    is_locked: lockReason != null,
    lock_reason: lockReason,
  };
}

function buildPermissions(row: RulesetRow, requester: RulesetRequester) {
  const lifecycle = buildLifecycle(row, requester);
  return {
    can_edit: !lifecycle.is_locked,
    can_delete: !lifecycle.is_locked,
  };
}

async function buildUsageReferences(env: Env, rulesetId: number) {
  const [tournamentDefaults, divisions] = await Promise.all([
    listRulesetTournamentDefaults(env.DB, rulesetId),
    listRulesetDivisions(env.DB, rulesetId),
  ]);

  return {
    tournament_defaults: tournamentDefaults,
    divisions,
  };
}

function buildRulesetDtoBase(row: RulesetRow, parsed: Ruleset, requester: RulesetRequester) {
  return {
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    created_by_user_id: row.created_by_user_id,
    creator_display_name: row.display_name,
    creator_discord_name: row.discord_name,
    config: parsed,
    summary: buildRulesetSummary(parsed),
    usage: buildUsageCounts(row),
    permissions: buildPermissions(row, requester),
    lifecycle: buildLifecycle(row, requester),
  };
}

function assertRulesetIsMutable(row: RulesetRow) {
  const usage = buildUsageCounts(row);

  if (usage.tournament_default_count > 0 && usage.division_count > 0) {
    httpError(409, 'Ruleset cannot be changed because it is used as a tournament default and by one or more divisions.');
  }

  if (usage.tournament_default_count > 0) {
    httpError(409, 'Ruleset cannot be changed because it is used as a tournament default.');
  }

  if (usage.division_count > 0) {
    httpError(409, 'Ruleset cannot be changed because it is assigned to one or more divisions.');
  }
}

export async function listRulesetDtos(env: Env, requester: RulesetRequester) {
  const rows = await listRulesets(env.DB);
  return rows.map((row) => {
    const parsed = parseConfigJsonOrThrow(row.config_json);
    return {
      id: row.id,
      name: row.name,
      created_at: row.created_at,
      created_by_user_id: row.created_by_user_id,
      creator_display_name: row.display_name,
      creator_discord_name: row.discord_name,
      summary: buildRulesetSummary(parsed),
      usage: buildUsageCounts(row),
      permissions: buildPermissions(row, requester),
      lifecycle: buildLifecycle(row, requester),
    };
  });
}

export async function getRulesetDto(env: Env, id: number, requester: RulesetRequester) {
  const row = await getRulesetById(env.DB, id);
  if (!row) httpError(404, 'Ruleset not found');
  const parsed = parseConfigJsonOrThrow(row.config_json);
  const usageReferences = await buildUsageReferences(env, id);

  return {
    ...buildRulesetDtoBase(row, parsed, requester),
    usage: {
      ...buildUsageCounts(row),
      ...usageReferences,
    }  
  };
}

export async function createRulesetDto(env: Env, input: { name: string; config: unknown; createdByUserId: number }, requester: RulesetRequester) {
  const parsed = parseRulesetOrThrow(input.config);
  const id = await createRuleset(env.DB, {
    name: input.name,
    configJson: JSON.stringify(parsed),
    createdByUserId: input.createdByUserId,
  });
  return await getRulesetDto(env, id, requester);
}

export async function updateRulesetDto(env: Env, input: { id: number; name: string; config: unknown }, requester: RulesetRequester) {
  const existing = await getRulesetById(env.DB, input.id);
  if (!existing) httpError(404, 'Ruleset not found');

  assertRulesetIsMutable(existing);

  const parsed = parseRulesetOrThrow(input.config);

  await updateRuleset(env.DB, {
    id: input.id,
    name: input.name,
    configJson: JSON.stringify(parsed),
  });
  return await getRulesetDto(env, input.id, requester);
}

export async function deleteRulesetDto(env: Env, id: number) {
  const existing = await getRulesetById(env.DB, id);
  if (!existing) httpError(404, 'Ruleset not found');

  assertRulesetIsMutable(existing);

  return deleteRuleset(env.DB, id);
}

export async function validateRulesetDto(config: unknown) {
  const parsed = safeParseRuleset(config);
  if (!parsed.success) {
    return {
      valid: false,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }

  return {
    valid: true,
    ruleset: parsed.data,
    summary: buildRulesetSummary(parsed.data),
  };
}

export function getRulesetCatalogDto() {
  return getRulesetCatalog();
}

export async function getDivisionRulesetDto(env: Env, input: { tournamentId: number; divisionId: number }) {
  const row = await getDivisionRulesetRow(env.DB, input);
  if (!row) httpError(404, 'Division not found');
  return {
    division_id: row.division_id,
    division_name: row.division_name,
    ruleset_id: row.ruleset_id,
    ruleset_name: row.ruleset_name,
    config: row.config_json ? parseConfigJsonOrThrow(row.config_json) : null,
  };
}

export async function getDivisionStandingsDto(env: Env, input: { tournamentId: number; divisionId: number; stageId?: string | null }) {
  const divisionRuleset = await getDivisionRulesetDto(env, input);
  if (!divisionRuleset.config) httpError(400, 'Division does not have a ruleset assigned');

  const stageId = input.stageId ?? divisionRuleset.config.stages[0]?.id;
  if (!stageId) httpError(400, 'Ruleset does not define any stages');
  const stage = getStageById(divisionRuleset.config, stageId);
  if (!stage.scoring) httpError(400, `Stage ${stage.id} does not define scoring`);

  const scoringSystem = divisionRuleset.config.scoring_systems[stage.scoring.system];
  if (!scoringSystem) httpError(400, `Unknown scoring system ${stage.scoring.system}`);

  const [players, matches] = await Promise.all([
    getDivisionPlayers(env.DB, input),
    getDivisionMatches(env.DB, { ...input, stageId }),
  ]);

  return {
    division_id: divisionRuleset.division_id,
    division_name: divisionRuleset.division_name,
    stage_id: stage.id,
    stage_name: stage.name,
    standings: calculateStandings(players, matches, scoringSystem, stage.tiebreakers),
  };
}

export async function getStagePreviewDto(env: Env, input: { tournamentId: number; divisionId: number; stageId: string }) {
  const divisionRuleset = await getDivisionRulesetDto(env, input);
  if (!divisionRuleset.config) httpError(400, 'Division does not have a ruleset assigned');
  const players = await getDivisionPlayers(env.DB, input);
  return {
    division_id: divisionRuleset.division_id,
    division_name: divisionRuleset.division_name,
    stage_id: input.stageId,
    preview: generateStagePreview(divisionRuleset.config, input.stageId, players),
  };
}

export async function getMatchFormatPreviewDto(env: Env, input: { tournamentId: number; divisionId: number; stageId: string; roundNumber?: number | null; roundLabel?: string | null }) {
  const divisionRuleset = await getDivisionRulesetDto(env, input);
  if (!divisionRuleset.config) httpError(400, 'Division does not have a ruleset assigned');

  const resolved = previewMatchFormat(divisionRuleset.config, input.stageId, input.roundNumber, input.roundLabel);
  return {
    stage_id: input.stageId,
    round_number: input.roundNumber ?? null,
    round_label: input.roundLabel ?? null,
    format_id: resolved.formatId,
    format: resolved.format,
  };
}
