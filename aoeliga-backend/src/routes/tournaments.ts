import { Hono } from 'hono';
import type { AppBindings } from '../types';
import { requireUser, optionalUser } from '../lib/auth_session';
import { httpError } from '../lib/http';
import { requirePermission, can } from '../lib/permissions';
import { withTournamentAccess, withTournamentBySlug } from '../lib/tournament';

const tournaments = new Hono<AppBindings>();

tournaments.get('/', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT * FROM tournaments ORDER BY created_at DESC`).all();
  
  return c.json({ tournaments: rows.results ?? [] });
});

tournaments.get('/:slug', optionalUser, withTournamentBySlug, withTournamentAccess, async (c) => {
  const user = c.get("user");
  const tournament = c.get("tournament");
  const tournamentRole = c.get("tournamentRole");
  const isTournamentStreamer = c.get("isTournamentStreamer");
  const isTournamentPlayer = c.get("isTournamentPlayer");

  return c.json({
    tournament,
    viewer: {
      is_authenticated: !!user,
      is_global_admin: user?.is_admin === 1,
      tournament_role: tournamentRole,
      is_tournament_streamer: isTournamentStreamer,
      is_tournament_player: isTournamentPlayer,
    },
  });
});

tournaments.put('/:slug', requireUser, withTournamentBySlug, withTournamentAccess, withTournamentAccess, requirePermission('tournament.update'), async (c) => {
  const slug = c.req.param('slug');
  const body = await c.req.json<{ name?: string; description?: string | null; status?: string; starts_at?: string | null; ends_at?: string | null }>();
  
  await c.env.DB.prepare(
    `UPDATE tournaments
     SET name = coalesce(?, name), description = ?, status = coalesce(?, status), starts_at = ?, ends_at = ?
     WHERE slug = ?`
  ).bind(body.name ?? null, body.description ?? null, body.status ?? null, body.starts_at ?? null, body.ends_at ?? null, slug).run();
  
  return c.json({ ok: true });
});

// divisions

tournaments.get('/:slug/divisions', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;
  
  const rows = await c.env.DB.prepare(`SELECT * FROM divisions WHERE tournament_id = ? ORDER BY id ASC`).bind(t.id).all();
  
  return c.json({ divisions: rows.results ?? [] });
});

tournaments.get('/:slug/divisions/:divisionId', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;
  const divisionId = Number(c.req.param('divisionId'));
  if (!Number.isInteger(divisionId) || divisionId <= 0)
    httpError(400, "Invalid division id");
  
  const row = await c.env.DB.prepare(`SELECT * FROM divisions WHERE id = ? AND tournament_id = ? LIMIT 1`).bind(divisionId, t.id).first();
  if (!row)
    httpError(404, 'Division not found');
  
  return c.json({ division: row });
});

tournaments.post('/:slug/divisions', requireUser, withTournamentBySlug, withTournamentAccess, withTournamentAccess, requirePermission('division.manage'), async (c) => {
  const t = c.get('tournament')!;
  const body = await c.req.json<{ name?: string; ruleset_id?: number | null }>();
  if (!body.name)
    httpError(400, 'name is required');
  
  await c.env.DB.prepare(`INSERT INTO divisions (tournament_id, name, ruleset_id) VALUES (?, ?, ?)`).bind(t.id, body.name, body.ruleset_id ?? null).run();
  
  return c.json({ ok: true }, 201);
});

tournaments.put('/:slug/divisions/:divisionId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('division.manage'), async (c) => {
  const t = c.get('tournament')!;
  const divisionId = Number(c.req.param('divisionId'));
  if (!Number.isInteger(divisionId) || divisionId <= 0)
    httpError(400, "Invalid division id");
  const body = await c.req.json<{ name?: string; ruleset_id?: number | null }>();
  
  await c.env.DB.prepare(`UPDATE divisions SET name = coalesce(?, name), ruleset_id = ? WHERE id = ? AND tournament_id = ?`)
    .bind(body.name ?? null, body.ruleset_id ?? null, divisionId, t.id).run();
  
  return c.json({ ok: true });
});

tournaments.delete('/:slug/divisions/:divisionId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('division.manage'), async (c) => {
  const t = c.get('tournament')!;
  const divisionId = Number(c.req.param('divisionId'));
  if (!Number.isInteger(divisionId) || divisionId <= 0)
    httpError(400, "Invalid division id");
  
  const result = await c.env.DB.prepare(`DELETE FROM divisions WHERE id = ? AND tournament_id = ?`).bind(divisionId, t.id).run();
  if ((result.meta.changes ?? 0) === 0)
    httpError(404, "Division not found");
  
  return c.json({ ok: true });
});

// admins

tournaments.get('/:slug/admins', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;
  
  const rows = await c.env.DB.prepare(
    `SELECT ta.user_id, ta.role, u.discord_id, u.discord_name, u.display_name, u.avatar
     FROM tournament_admins ta
     JOIN users u ON u.id = ta.user_id
     WHERE ta.tournament_id = ?
     ORDER BY ta.role ASC, u.display_name ASC, u.discord_name ASC`
  ).bind(t.id).all();
  
  return c.json({ admins: rows.results ?? [] });
});

tournaments.post('/:slug/admins', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('admin.assign'), async (c) => {
  const t = c.get('tournament')!;
  const body = await c.req.json<{ user_id?: number; role?: 'admin' | 'moderator' }>();
  if (!body.user_id || !body.role)
    httpError(400, 'user_id and role are required');
  
  await c.env.DB.prepare(
    `INSERT INTO tournament_admins (tournament_id, user_id, role) VALUES (?, ?, ?)
     ON CONFLICT(tournament_id, user_id) DO UPDATE SET role = excluded.role`
  ).bind(t.id, body.user_id, body.role).run();
  
  return c.json({ ok: true }, 201);
});

tournaments.put('/:slug/admins/:userId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('admin.assign'), async (c) => {
  const t = c.get('tournament')!;
  const userId = Number(c.req.param('userId'));
  if (!Number.isInteger(userId) || userId <= 0)
    httpError(400, "Invalid user id");
  const body = await c.req.json<{ role?: 'admin' | 'moderator' }>();
  if (!body.role)
    httpError(400, 'role is required');
  
  await c.env.DB.prepare(`UPDATE tournament_admins SET role = ? WHERE tournament_id = ? AND user_id = ?`).bind(body.role, t.id, userId).run();
  
  return c.json({ ok: true });
});

tournaments.delete('/:slug/admins/:userId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('admin.assign'), async (c) => {
  const t = c.get('tournament')!;
  const userId = Number(c.req.param('userId'));
  if (!Number.isInteger(userId) || userId <= 0)
    httpError(400, "Invalid user id");
  
  const result = await c.env.DB.prepare(`DELETE FROM tournament_admins WHERE tournament_id = ? AND user_id = ?`).bind(t.id, userId).run();
  if ((result.meta.changes ?? 0) === 0)
    httpError(404, "Admin user not found");
  
  return c.json({ ok: true });
});

// streamers

tournaments.get('/:slug/streamers', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;
  
  const rows = await c.env.DB.prepare(
    `SELECT ts.user_id, ts.stream_url,
            u.discord_id, u.discord_name, u.display_name as user_display_name, u.avatar
     FROM tournament_streamers ts
     JOIN users u ON u.id = ts.user_id
     WHERE ts.tournament_id = ?
     ORDER BY coalesce(u.display_name, u.discord_name) ASC`
  ).bind(t.id).all();
  
  return c.json({ streamers: rows.results ?? [] });
});

tournaments.post('/:slug/streamers', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('streamer.assign'), async (c) => {
  const t = c.get('tournament')!;
  const body = await c.req.json<{ user_id?: number; display_name?: string | null; stream_url?: string | null; language?: string | null }>();
  
  if (!body.user_id)
    httpError(400, 'user_id is required');
  
  await c.env.DB.prepare(
    `INSERT INTO tournament_streamers (tournament_id, user_id, stream_url)
     VALUES (?, ?, ?)
     ON CONFLICT(tournament_id, user_id) DO UPDATE SET
       stream_url = excluded.stream_url`
  ).bind(t.id, body.user_id, body.stream_url ?? null).run();
  
  return c.json({ ok: true }, 201);
});

tournaments.put('/:slug/streamers/:userId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('streamer.manage'), async (c) => {
  const t = c.get('tournament')!;
  const userId = Number(c.req.param('userId'));
  if (!Number.isInteger(userId) || userId <= 0)
    httpError(400, "Invalid user id");
  const body = await c.req.json<{ display_name?: string | null; stream_url?: string | null; language?: string | null }>();
  
  await c.env.DB.prepare(
    `UPDATE tournament_streamers
     SET stream_url = ?
     WHERE tournament_id = ? AND user_id = ?`
  ).bind(body.stream_url ?? null, t.id, userId).run();
  
  return c.json({ ok: true });
});

tournaments.delete('/:slug/streamers/:userId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('streamer.assign'), async (c) => {
  const t = c.get('tournament')!;
  const userId = Number(c.req.param('userId'));
  if (!Number.isInteger(userId) || userId <= 0)
    httpError(400, "Invalid user id");
  
  const result = await c.env.DB.prepare(`DELETE FROM tournament_streamers WHERE tournament_id = ? AND user_id = ?`).bind(t.id, userId).run();
  if ((result.meta.changes ?? 0) === 0)
    httpError(404, "Streamer user not found");
  
  return c.json({ ok: true });
});

// players

tournaments.get('/:slug/players', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;
  
  const rows = await c.env.DB.prepare(
    `SELECT tp.*, u.discord_id, u.discord_name, u.display_name, u.avatar, d.name as division_name
     FROM tournament_players tp
     JOIN users u ON u.id = tp.user_id
     LEFT JOIN divisions d ON d.id = tp.division_id
     WHERE tp.tournament_id = ?
     ORDER BY tp.id ASC`
  ).bind(t.id).all();
  
  return c.json({ players: rows.results ?? [] });
});

tournaments.get('/:slug/players/:playerId', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;
  const playerId = Number(c.req.param('playerId'));
  if (!Number.isInteger(playerId) || playerId <= 0)
    httpError(400, "Invalid player id");
  
  const row = await c.env.DB.prepare(
    `SELECT tp.*, u.discord_id, u.discord_name, u.display_name, u.avatar, d.name as division_name
     FROM tournament_players tp
     JOIN users u ON u.id = tp.user_id
     LEFT JOIN divisions d ON d.id = tp.division_id
     WHERE tp.id = ? AND tp.tournament_id = ? LIMIT 1`
  ).bind(playerId, t.id).first();
  if (!row)
     httpError(404, 'Tournament player not found');
  
  return c.json({ player: row });
});

tournaments.post('/:slug/players', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('player.register'), async (c) => {
  const t = c.get('tournament')!;
  const user = c.get('user')!;
  const body = await c.req.json<{ user_id?: number; division_id?: number | null; aoe_id?: string; seed?: number | null; status?: string }>();
  if (!body.aoe_id)
    httpError(400, 'aoe_id is required');
  
  const actingAsSelf = !body.user_id || body.user_id === user.id;
  const userId = actingAsSelf ? user.id : body.user_id;
  if (!actingAsSelf) {
    const allowed = await can(c, 'player.manage');
    if (!allowed) 
      httpError(403, 'Forbidden');
  }

  await c.env.DB.prepare(
    `INSERT INTO tournament_players (tournament_id, user_id, division_id, aoe_id, seed, status)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(t.id, userId, body.division_id ?? null, body.aoe_id, body.seed ?? null, actingAsSelf ? 'pending' : (body.status ?? 'active')).run();

  return c.json({ ok: true }, 201);
});

tournaments.put('/:slug/players/:playerId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('player.manage'), async (c) => {
  const t = c.get('tournament')!;
  const playerId = Number(c.req.param('playerId'));
  if (!Number.isInteger(playerId) || playerId <= 0)
    httpError(400, "Invalid player id");
  const body = await c.req.json<{ division_id?: number | null; seed?: number | null; status?: string; aoe_id?: string }>();
  
  await c.env.DB.prepare(
    `UPDATE tournament_players
     SET division_id = ?, seed = ?, status = coalesce(?, status), aoe_id = coalesce(?, aoe_id)
     WHERE id = ? AND tournament_id = ?`
  ).bind(body.division_id ?? null, body.seed ?? null, body.status ?? null, body.aoe_id ?? null, playerId, t.id).run();
  
  return c.json({ ok: true });
});

tournaments.delete('/:slug/players/:playerId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('player.manage'), async (c) => {
  const t = c.get('tournament')!;
  const playerId = Number(c.req.param('playerId'));
  if (!Number.isInteger(playerId) || playerId <= 0)
    httpError(400, "Invalid player id");
  
  const result = await c.env.DB.prepare(`DELETE FROM tournament_players WHERE id = ? AND tournament_id = ?`).bind(playerId, t.id).run();
  if ((result.meta.changes ?? 0) === 0)
    httpError(404, "Player not found");
  
  return c.json({ ok: true });
});

// matches

tournaments.get('/:slug/matches', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;
  const divisionId = c.req.query('divisionId');
  const week = c.req.query('week');
  const state = c.req.query('state');

  let sql = `SELECT * FROM matches WHERE tournament_id = ?`;
  const params: (string | number)[] = [t.id];
  if (divisionId) { sql += ` AND division_id = ?`; params.push(Number(divisionId)); }
  if (week) { sql += ` AND week_number = ?`; params.push(Number(week)); }
  if (state) { sql += ` AND state = ?`; params.push(state); }
  sql += ` ORDER BY coalesce(week_number, 0), id`;
  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  
  return c.json({ matches: rows.results ?? [] });
});

tournaments.get('/:slug/matches/:matchId', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;
  const matchId = Number(c.req.param('matchId'));
  if (!Number.isInteger(matchId) || matchId <= 0)
    httpError(400, "Invalid match id");
  
  const row = await c.env.DB.prepare(`SELECT * FROM matches WHERE id = ? AND tournament_id = ? LIMIT 1`).bind(matchId, t.id).first();
  if (!row)
    httpError(404, 'Match not found');
  
  return c.json({ match: row });
});

tournaments.post('/:slug/matches', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('match.manage'), async (c) => {
  const t = c.get('tournament')!;
  const body = await c.req.json<{ division_id?: number; stage?: string; round_number?: number | null; week_number?: number | null; player1_id?: number; player2_id?: number; scheduled_for?: string | null; state?: string }>();
  if (!body.division_id || !body.player1_id || !body.player2_id)
    httpError(400, 'division_id, player1_id and player2_id are required');
  
  await c.env.DB.prepare(
    `INSERT INTO matches (tournament_id, division_id, stage, round_number, week_number, player1_id, player2_id, scheduled_for, state)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(t.id, body.division_id, body.stage ?? 'group', body.round_number ?? null, body.week_number ?? null, body.player1_id, body.player2_id, body.scheduled_for ?? null, body.state ?? 'created').run();
  
  return c.json({ ok: true }, 201);
});

tournaments.put('/:slug/matches/:matchId', requireUser, withTournamentBySlug, withTournamentAccess, async (c) => {
  const t = c.get('tournament')!;
  const matchId = Number(c.req.param('matchId'));
  if (!Number.isInteger(matchId) || matchId <= 0)
    httpError(400, "Invalid match id");
  const body = await c.req.json<{ scheduled_for?: string | null; state?: string; player1_points?: number; player2_points?: number; played_on?: string | null }>();

  const canManage = await can(c, 'match.manage');
  const canScheduleOwn = await can(c, 'match.schedule.own', { matchId });
  if (!canManage && !canScheduleOwn) {
    httpError(403, 'Forbidden');
  }

  if (canManage) {
    await c.env.DB.prepare(
      `UPDATE matches
       SET scheduled_for = ?, state = coalesce(?, state), player1_points = coalesce(?, player1_points),
           player2_points = coalesce(?, player2_points), played_on = ?
       WHERE id = ? AND tournament_id = ?`
    ).bind(body.scheduled_for ?? null, body.state ?? null, body.player1_points ?? null, body.player2_points ?? null, body.played_on ?? null, matchId, t.id).run();
  } else {
    await c.env.DB.prepare(
      `UPDATE matches SET scheduled_for = ?, state = coalesce(?, state) WHERE id = ? AND tournament_id = ?`
    ).bind(body.scheduled_for ?? null, body.state ?? null, matchId, t.id).run();
  }

  return c.json({ ok: true });
});

tournaments.delete('/:slug/matches/:matchId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('match.manage'), async (c) => {
  const t = c.get('tournament')!;
  const matchId = Number(c.req.param('matchId'));
  if (!Number.isInteger(matchId) || matchId <= 0)
    httpError(400, "Invalid match id");
  
  const result = await c.env.DB.prepare(`DELETE FROM matches WHERE id = ? AND tournament_id = ?`).bind(matchId, t.id).run();
  if ((result.meta.changes ?? 0) === 0)
    httpError(404, "Match not found");
  
  return c.json({ ok: true });
});

// replays

tournaments.get('/:slug/matches/:matchId/replays', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;
  const matchId = Number(c.req.param('matchId'));
  if (!Number.isInteger(matchId) || matchId <= 0)
    httpError(400, "Invalid match id");
  
  const rows = await c.env.DB.prepare(`SELECT * FROM replays WHERE tournament_id = ? AND match_id = ? ORDER BY uploaded_at ASC`).bind(t.id, matchId).all();
  
  return c.json({ replays: rows.results ?? [] });
});

tournaments.post('/:slug/matches/:matchId/replays', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('replay.upload.own', (c) => ({ matchId: Number(c.req.param('matchId')) })), async (c) => {
  const t = c.get('tournament')!;
  const user = c.get('user')!;
  const matchId = Number(c.req.param('matchId'));
  if (!Number.isInteger(matchId) || matchId <= 0)
    httpError(400, "Invalid match id");
  const body = await c.req.json<{ r2_object_key?: string; file_size_bytes?: number | null; content_hash?: string | null; original_filename?: string | null }>();
  if (!body.r2_object_key)
    httpError(400, 'r2_object_key is required');
  
  await c.env.DB.prepare(
    `INSERT INTO replays (match_id, tournament_id, uploaded_by, r2_object_key, file_size_bytes, content_hash, original_filename)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(matchId, t.id, user.id, body.r2_object_key, body.file_size_bytes ?? null, body.content_hash ?? null, body.original_filename ?? null).run();
  
  return c.json({ ok: true }, 201);
});

// match units

tournaments.get('/:slug/matches/:matchId/units', optionalUser, withTournamentBySlug, async (c) => {
  const matchId = Number(c.req.param('matchId'));
  if (!Number.isInteger(matchId) || matchId <= 0)
    httpError(400, "Invalid match id");
  
  const rows = await c.env.DB.prepare(`SELECT * FROM match_units WHERE match_id = ? ORDER BY unit_index ASC`).bind(matchId).all();
  
  return c.json({ units: rows.results ?? [] });
});

tournaments.get('/:slug/matches/:matchId/units/:unitId', optionalUser, withTournamentBySlug, async (c) => {
  const matchId = Number(c.req.param('matchId'));
  if (!Number.isInteger(matchId) || matchId <= 0)
    httpError(400, "Invalid match id");
  const unitId = Number(c.req.param('unitId'));
  if (!Number.isInteger(unitId) || unitId <= 0)
    httpError(400, "Invalid unit id");
  
  const row = await c.env.DB.prepare(`SELECT * FROM match_units WHERE id = ? AND match_id = ? LIMIT 1`).bind(unitId, matchId).first();
  if (!row)
    httpError(404, 'Match unit not found');
  
  return c.json({ unit: row });
});

export default tournaments;
