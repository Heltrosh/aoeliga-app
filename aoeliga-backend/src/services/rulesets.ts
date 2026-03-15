import { httpError } from '../lib/http';
import { getRulesetCatalog } from '../domain/rulesets/catalog';
import { parseRulesetOrThrow, safeParseRuleset } from '../domain/rulesets/parse';
import { generateStagePreview, previewMatchFormat, getStageById } from '../domain/rulesets/engine';
import { calculateStandings } from '../domain/rulesets/scoring/standings';
import type { Ruleset } from '../domain/rulesets/schema';
import { createRuleset, deleteRuleset, getDivisionRulesetRow, getRulesetById, listRulesets, updateRuleset } from '../repositories/rulesets';
import { getDivisionPlayers } from '../repositories/players';
import { getDivisionMatches } from '../repositories/matches';
import type { Env } from '../types/env';

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

export async function listRulesetDtos(env: Env) {
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
      config: parsed,
      summary: buildRulesetSummary(parsed),
    };
  });
}

export async function getRulesetDto(env: Env, id: number) {
  const row = await getRulesetById(env.DB, id);
  if (!row) httpError(404, 'Ruleset not found');
  const parsed = parseConfigJsonOrThrow(row.config_json);
  return {
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    created_by_user_id: row.created_by_user_id,
    creator_display_name: row.display_name,
    creator_discord_name: row.discord_name,
    config: parsed,
    summary: buildRulesetSummary(parsed),
  };
}

export async function createRulesetDto(env: Env, input: { name: string; config: unknown; createdByUserId: number }) {
  const parsed = parseRulesetOrThrow(input.config);
  const id = await createRuleset(env.DB, {
    name: input.name,
    configJson: JSON.stringify(parsed),
    createdByUserId: input.createdByUserId,
  });
  return await getRulesetDto(env, id);
}

export async function updateRulesetDto(env: Env, input: { id: number; name: string; config: unknown }) {
  const existing = await getRulesetById(env.DB, input.id);
  if (!existing) httpError(404, 'Ruleset not found');
  const parsed = parseRulesetOrThrow(input.config);
  await updateRuleset(env.DB, {
    id: input.id,
    name: input.name,
    configJson: JSON.stringify(parsed),
  });
  return await getRulesetDto(env, input.id);
}

export async function deleteRulesetDto(env: Env, id: number) {
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
