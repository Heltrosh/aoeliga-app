import { Db } from "../types/env";

export type RulesetRow = {
  id: number;
  name: string;
  config_json: string;
  created_at: string;
  created_by_user_id: number;
  display_name: string | null;
  discord_name: string | null;
  tournament_default_count: number;
  division_count: number;
};

export type RulesetTournamentReferenceRow = {
  id: number;
  slug: string;
  name: string;
};

export type RulesetDivisionReferenceRow = {
  id: number;
  name: string;
  tournament_id: number;
  tournament_name: string;
  tournament_slug: string;
};


const RULESET_WITH_USAGE_SELECT = `
  SELECT
    r.id,
    r.name,
    r.config_json,
    r.created_at,
    r.created_by_user_id,
    u.display_name,
    u.discord_name,
    COALESCE(td.tournament_default_count, 0) AS tournament_default_count,
    COALESCE(dd.division_count, 0) AS division_count
  FROM rulesets r
  JOIN users u ON u.id = r.created_by_user_id
  LEFT JOIN (
    SELECT default_ruleset AS ruleset_id, COUNT(*) AS tournament_default_count
    FROM tournaments
    WHERE default_ruleset IS NOT NULL
    GROUP BY default_ruleset
  ) td ON td.ruleset_id = r.id
  LEFT JOIN (
    SELECT ruleset_id, COUNT(*) AS division_count
    FROM divisions
    WHERE ruleset_id IS NOT NULL
    GROUP BY ruleset_id
  ) dd ON dd.ruleset_id = r.id
`;

export async function listRulesets(db: Db): Promise<RulesetRow[]> {
  const rows = await db.prepare(
    `${RULESET_WITH_USAGE_SELECT}
     ORDER BY r.id DESC`
  ).all<RulesetRow>();

  return rows.results ?? [];
}

export async function getRulesetById(db: Db, id: number): Promise<RulesetRow | null> {
  return await db.prepare(
    `${RULESET_WITH_USAGE_SELECT}
     WHERE r.id = ?
     LIMIT 1`
  ).bind(id).first<RulesetRow>();
}

export async function createRuleset(db: Db, input: { name: string; configJson: string; createdByUserId: number }) {
  const result = await db.prepare(
    `INSERT INTO rulesets (name, config_json, created_by_user_id)
     VALUES (?, ?, ?)`
  ).bind(input.name, input.configJson, input.createdByUserId).run();

  return result.meta.last_row_id as number;
}

export async function updateRuleset(db: Db, input: { id: number; name: string; configJson: string }) {
  await db.prepare(`UPDATE rulesets SET name = ?, config_json = ? WHERE id = ?`).bind(input.name, input.configJson, input.id).run();
}

export async function deleteRuleset(db: Db, id: number) {
  return await db.prepare(`DELETE FROM rulesets WHERE id = ?`).bind(id).run();
}

export async function listRulesetTournamentDefaults(
  db: Db,
  rulesetId: number,
): Promise<RulesetTournamentReferenceRow[]> {
  const rows = await db
    .prepare(
      `SELECT id, slug, name
       FROM tournaments
       WHERE default_ruleset = ?
       ORDER BY id DESC`
    )
    .bind(rulesetId)
    .all<RulesetTournamentReferenceRow>();

  return rows.results ?? [];
}

export async function listRulesetDivisions(
  db: Db,
  rulesetId: number,
): Promise<RulesetDivisionReferenceRow[]> {
  const rows = await db
    .prepare(
      `SELECT
         d.id,
         d.name,
         t.id AS tournament_id,
         t.name AS tournament_name,
         t.slug AS tournament_slug
       FROM divisions d
       JOIN tournaments t ON t.id = d.tournament_id
       WHERE d.ruleset_id = ?
       ORDER BY t.id DESC, d.id DESC`
    )
    .bind(rulesetId)
    .all<RulesetDivisionReferenceRow>();

  return rows.results ?? [];
}

export async function getDivisionRulesetRow(db: Db, input: { tournamentId: number; divisionId: number }) {
  return await db.prepare(
    `SELECT d.id as division_id, d.name as division_name, r.id as ruleset_id, r.name as ruleset_name, r.config_json
     FROM divisions d
     LEFT JOIN rulesets r ON r.id = d.ruleset_id
     WHERE d.id = ? AND d.tournament_id = ?
     LIMIT 1`
  ).bind(input.divisionId, input.tournamentId).first<{
    division_id: number;
    division_name: string;
    ruleset_id: number | null;
    ruleset_name: string | null;
    config_json: string | null;
  }>();
}
