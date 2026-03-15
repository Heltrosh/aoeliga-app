import type { Db } from '../types/env';
import type { EnginePlayer } from '../domain/rulesets/types';

export async function getDivisionPlayers(db: Db, input: { tournamentId: number; divisionId: number }): Promise<EnginePlayer[]> {
  const rows = await db.prepare(
    `SELECT tp.id, tp.user_id, tp.seed, tp.status, u.display_name, u.discord_name
     FROM tournament_players tp
     JOIN users u ON u.id = tp.user_id
     WHERE tp.tournament_id = ?
       AND tp.division_id = ?
       AND tp.status IN ('active', 'approved', 'pending')
     ORDER BY COALESCE(tp.seed, 999999), COALESCE(u.display_name, u.discord_name)`
  ).bind(input.tournamentId, input.divisionId).all<EnginePlayer>();

  return rows.results ?? [];
}
