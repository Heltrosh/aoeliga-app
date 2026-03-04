import type { UserRow } from "./auth_session";
import type { Env } from "./auth_session";
import type { Context } from "hono";

export function isGlobalAdmin(user: UserRow): boolean {
  return user.is_admin === 1;
}

export async function getTournamentRole(
  db: D1Database,
  tournamentId: number,
  userId: number
): Promise<string | null> {
  const row = await db.prepare(
    `SELECT role FROM tournament_admins WHERE tournament_id = ? AND user_id = ?`
  ).bind(tournamentId, userId).first<{ role: string }>();

  return row?.role ?? null;
}

export async function isTournamentPlayer(
  db: D1Database,
  tournamentId: number,
  userId: number
): Promise<number | null> {
  const row = await db.prepare(
    `SELECT id FROM tournament_players WHERE tournament_id = ? AND user_id = ?`
  ).bind(tournamentId, userId).first<{ id: number }>();

  return row?.id ?? null; // tournament_players.id (tp_id)
}

export async function getMatchContext(
  db: D1Database,
  matchId: number
): Promise<{
  match_id: number;
  tournament_id: number;
  division_id: number;
  home_player_id: number;
  away_player_id: number;
} | null> {
  const row = await db.prepare(
    `SELECT id as match_id, tournament_id, division_id, home_player_id, away_player_id
     FROM matches
     WHERE id = ?`
  ).bind(matchId).first<any>();

  return row ?? null;
}

export async function isUserInMatch(
  db: D1Database,
  matchId: number,
  userId: number
): Promise<boolean> {
  // check if the user’s tournament_players row is either home or away for this match
  const row = await db.prepare(
    `SELECT 1
     FROM matches m
     JOIN tournament_players tp
       ON tp.tournament_id = m.tournament_id
      AND tp.user_id = ?
     WHERE m.id = ?
       AND (tp.id = m.home_player_id OR tp.id = m.away_player_id)
     LIMIT 1`
  ).bind(userId, matchId).first();

  return !!row;
}

// Role gate for tournament staff
export function requireTournamentRole(allowed: string[]) {
  return async (c: Context<{ Bindings: Env; Variables: { user: UserRow } }>, next: Function) => {
    const user = c.get("user");
    if (isGlobalAdmin(user)) return next();

    const tid = Number(c.req.param("tournamentId"));
    if (!Number.isFinite(tid)) return c.json({ error: "Bad tournamentId" }, 400);

    const role = await getTournamentRole(c.env.DB, tid, user.id);
    if (!role || !allowed.includes(role)) return c.json({ error: "Forbidden" }, 403);

    await next();
  };
}