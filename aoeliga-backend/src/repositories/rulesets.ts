import { Db } from "../types/env";

export type RulesetRow = {
  id: number;
  name: string;
  config_json: string;
  created_at: string;
  created_by_user_id: number;
  display_name: string | null;
  discord_name: string | null;
};

export async function listRulesets(db: Db): Promise<RulesetRow[]> {
  const rows = await db.prepare(
    `SELECT r.id, r.name, r.config_json, r.created_at, r.created_by_user_id,
            u.display_name, u.discord_name
     FROM rulesets r
     JOIN users u ON u.id = r.created_by_user_id
     ORDER BY r.id DESC`
  ).all<RulesetRow>();

  return rows.results ?? [];
}

export async function getRulesetById(db: Db, id: number): Promise<RulesetRow | null> {
  return await db.prepare(
    `SELECT r.id, r.name, r.config_json, r.created_at, r.created_by_user_id,
            u.display_name, u.discord_name
     FROM rulesets r
     JOIN users u ON u.id = r.created_by_user_id
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
