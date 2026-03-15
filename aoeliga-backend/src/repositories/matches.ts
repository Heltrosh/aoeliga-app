import type { Db } from '../types/env';
import type { EngineMatch } from '../domain/rulesets/types';

export async function getDivisionMatches(db: Db, input: { tournamentId: number; divisionId: number; stageId?: string | null }): Promise<EngineMatch[]> {
  let sql = `
    SELECT id, player1_id, player2_id, player1_points, player2_points,
           state as status, stage, round_number, week_number, played_on
    FROM matches
    WHERE tournament_id = ?
      AND division_id = ?`;
  const params: Array<string | number> = [input.tournamentId, input.divisionId];
  if (input.stageId) {
    sql += ` AND stage = ?`;
    params.push(input.stageId);
  }
  sql += ` ORDER BY COALESCE(round_number, 0), id`;

  const rows = await db.prepare(sql).bind(...params).all<EngineMatch>();
  return rows.results ?? [];
}
