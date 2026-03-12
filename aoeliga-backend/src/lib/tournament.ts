import type { Context, MiddlewareHandler } from "hono";
import type { AppBindings } from "../types/app";
import type { TournamentRole } from "../domain/statuses";
import type { TournamentRow } from "../domain/tournament";
import { httpError } from "./http";

export const withTournamentBySlug: MiddlewareHandler<AppBindings> = async (c, next) => {
  const slug = c.req.param("slug");

  const tournament = await c.env.DB.prepare(
    `SELECT * FROM tournaments WHERE slug = ? LIMIT 1`
  )
    .bind(slug)
    .first<TournamentRow>();

  if (!tournament) httpError(404, "Tournament not found");

  c.set("tournament", tournament);
  c.set("tournamentRole", null);
  c.set("isTournamentStreamer", false);
  c.set("isTournamentPlayer", false);

  await next();
};

export async function loadTournamentAccess(c: Context<AppBindings>) {
  const tournament = c.get("tournament");
  const user = c.get("user");

  if (!tournament || !user) {
    c.set("tournamentRole", null);
    c.set("isTournamentStreamer", false);
    c.set("isTournamentPlayer", false);
    return;
  }

  const adminRow = await c.env.DB.prepare(
    `SELECT role
     FROM tournament_admins
     WHERE tournament_id = ? AND user_id = ?
     LIMIT 1`
  )
    .bind(tournament.id, user.id)
    .first<{ role: TournamentRole }>();

  const streamerRow = await c.env.DB.prepare(
    `SELECT 1 as ok
     FROM tournament_streamers
     WHERE tournament_id = ? AND user_id = ?
     LIMIT 1`
  )
    .bind(tournament.id, user.id)
    .first<{ ok: number }>();

  const playerRow = await c.env.DB.prepare(
    `SELECT 1 as ok
     FROM tournament_players
     WHERE tournament_id = ? AND user_id = ?
     LIMIT 1`
  )
    .bind(tournament.id, user.id)
    .first<{ ok: number }>();

  c.set("tournamentRole", adminRow?.role ?? null);
  c.set("isTournamentStreamer", !!streamerRow);
  c.set("isTournamentPlayer", !!playerRow);
}

export const withTournamentAccess: MiddlewareHandler<AppBindings> = async (c, next) => {
  await loadTournamentAccess(c);
  await next();
};