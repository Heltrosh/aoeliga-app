import type { Context, MiddlewareHandler } from 'hono';
import type { AppBindings, AuthUser } from '../types';
import { httpError } from './http';

export type PermissionAction =
  | 'platform.admin'
  | 'user.search'
  | 'tournament.update'
  | 'division.manage'
  | 'player.register'
  | 'player.manage'
  | 'player.review'
  | 'admin.assign'
  | 'moderator.assign'
  | 'streamer.assign'
  | 'streamer.manage'
  | 'match.manage'
  | 'match.report.own'
  | 'match.schedule.own'
  | 'replay.upload.own'
  | 'ruleset.create'
  | 'ruleset.update.own'
  | 'user.lightweight';

type PermissionExtras = {
  matchId?: number;
  ownerUserId?: number;
};

async function isOwnMatchParticipant(c: Context<AppBindings>, matchId: number): Promise<boolean> {
  const tournament = c.get('tournament');
  const user = c.get('user');
  if (!tournament || !user) return false;

  const row = await c.env.DB.prepare(
    `SELECT 1 as ok
     FROM matches m
     JOIN tournament_players tp1 ON tp1.id = m.player1_id
     JOIN tournament_players tp2 ON tp2.id = m.player2_id
     WHERE m.id = ?
       AND m.tournament_id = ?
       AND (tp1.user_id = ? OR tp2.user_id = ?)
     LIMIT 1`
  ).bind(matchId, tournament.id, user.id, user.id).first<{ ok: number }>();

  return !!row;
}

export async function can(c: Context<AppBindings>, action: PermissionAction, extras: PermissionExtras = {}): Promise<boolean> {
  const user = c.get('user');
  const tournament = c.get('tournament'); 
  const role = c.get('tournamentRole');
  const isStreamer = c.get('isTournamentStreamer');
  const isPlayer = c.get("isTournamentPlayer");

  if (action === 'user.search') return !!user;
  if (action === 'platform.admin') return isGlobalAdmin(user);

  if (!user) return false;
  if (isGlobalAdmin(user)) return true;

  switch (action) {
    case 'tournament.update':
    case 'division.manage':
    case 'admin.assign':
      return !!tournament && role === 'admin';
    case 'moderator.assign':
        return !!tournament && role === "admin";
    case 'streamer.assign':
        return !!tournament && (role === "admin" || role === "moderator");
    case 'streamer.manage':
        return !!tournament && (role === "admin" || role === "moderator" || isStreamer);
    case 'player.manage':
    case 'player.review':
    case 'match.manage':
      return !!tournament && (role === "admin" || role === "moderator");
    case 'player.register':
      return true;
    case 'ruleset.create':
        return await isTournamentAdminAnywhere(c, user.id);
    case 'ruleset.update.own':
      return extras.ownerUserId === user.id;
    case 'match.report.own':
    case 'match.schedule.own':
    case 'replay.upload.own':
      return !!tournament && isPlayer && !!extras.matchId
        ? await isOwnMatchParticipant(c, extras.matchId)
        : false;
    case 'user.lightweight':
      return await isTournamentAdminAnywhere(c, user.id) || await isTournamentModeratorAnywhere(c, user.id) ;
    default:
      return false;
  }
}

export function requirePermission(action: PermissionAction, extras?: (c: Context<AppBindings>) => Promise<PermissionExtras> | PermissionExtras): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) httpError(401, "Unauthorized");
    const resolved = extras ? await extras(c) : {};
    const allowed = await can(c, action, resolved);
    if (!allowed) httpError(403, "Forbidden");
    await next();
  };
}

async function isTournamentAdminAnywhere(c: Context<AppBindings>, userId: number): Promise<boolean> {
  const row = await c.env.DB.prepare(
    `SELECT 1 as ok
     FROM tournament_admins
     WHERE user_id = ?
       AND role = 'admin'
     LIMIT 1`
  )
    .bind(userId).first<{ ok: number }>();

  return !!row;
}

async function isTournamentModeratorAnywhere(c: Context<AppBindings>, userId: number): Promise<boolean> {
  const row = await c.env.DB.prepare(
    `SELECT 1 as ok
     FROM tournament_admins
     WHERE user_id = ?
       AND role = 'moderator'
     LIMIT 1`
  )
    .bind(userId).first<{ ok: number }>();

  return !!row;
}


export function isGlobalAdmin(user: AuthUser | null): boolean {
  return !!user && user.is_admin === 1;
}