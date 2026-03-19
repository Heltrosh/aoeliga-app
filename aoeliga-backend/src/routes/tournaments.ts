import { Hono } from 'hono';
import type { AppBindings } from '../types/app';
import { requireUser, optionalUser } from '../lib/auth_session';
import { httpError } from '../lib/http';
import { requirePermission, can } from '../lib/permissions';
import { withTournamentAccess, withTournamentBySlug } from '../lib/tournament';
import { getDivisionRulesetDto, getDivisionStandingsDto, getMatchFormatPreviewDto, getStagePreviewDto } from '../services/rulesets';
import type { TournamentRegistrationRow, TournamentRegistrationSelfCapabilities, TournamentRegistrationSelfDto } from '../domain/registration';
import type { TournamentRow } from '../domain/tournament';
import { fetchRegistrationSnapshot } from '../lib/registration';

const tournaments = new Hono<AppBindings>();

type TournamentRegistrationStaffRow = TournamentRegistrationRow & {
  discord_id: string | null;
  discord_name: string | null;
  display_name: string | null;
  avatar: string | null;
};

function assertValidUserId(value: string, label = 'user id'): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    httpError(400, `Invalid ${label}`);
  }
  return parsed;
}

function assertRegistrationsAvailableForRead(tournament: TournamentRow) {
  if (
    tournament.status === 'active' ||
    tournament.status === 'completed' ||
    tournament.status === 'archived'
  ) {
    httpError(403, 'Registrations are no longer accessible for this tournament');
  }
}

function assertSelfRegistrationWindow(tournament: TournamentRow) {
  if (tournament.status !== 'signup') {
    httpError(409, 'Registrations are not available for this tournament');
  }

  if (tournament.registrations_open !== 1) {
    httpError(409, 'Registrations are currently closed');
  }

  if (
    !Number.isInteger(tournament.recent_games_days) ||
    (tournament.recent_games_days ?? 0) <= 0
  ) {
    httpError(409, 'Tournament registration settings are incomplete');
  }
}

function assertAdminCreateWindow(tournament: TournamentRow) {
  if (tournament.status !== 'draft' && tournament.status !== 'signup') {
    httpError(409, 'Registrations cannot be managed after the tournament has started');
  }

  if (
    !Number.isInteger(tournament.recent_games_days) ||
    (tournament.recent_games_days ?? 0) <= 0
  ) {
    httpError(409, 'Tournament registration settings are incomplete');
  }
}

function toSelfRegistrationDto(row: TournamentRegistrationRow): TournamentRegistrationSelfDto {
  return {
    id: row.id,
    tournament_id: row.tournament_id,
    user_id: row.user_id,
    aoe_id: row.aoe_id,
    aoe_name: row.aoe_name,
    status: row.status,
    submitted_at: row.submitted_at,
    updated_at: row.updated_at,
    note: row.note,
  };
}

function toStaffRegistrationDto(row: TournamentRegistrationStaffRow) {
  return {
    id: row.id,
    tournament_id: row.tournament_id,
    user_id: row.user_id,
    aoe_id: row.aoe_id,
    aoe_name: row.aoe_name,
    signup_rating: row.signup_rating,
    signup_max_rating: row.signup_max_rating,
    signup_team_rating: row.signup_team_rating,
    signup_max_team_rating: row.signup_max_team_rating,
    current_rating: row.current_rating,
    current_max_rating: row.current_max_rating,
    current_team_rating: row.current_team_rating,
    current_max_team_rating: row.current_max_team_rating,
    current_data_fetched_at: row.current_data_fetched_at,
    total_games: row.total_games,
    recent_games: row.recent_games,
    status: row.status,
    submitted_at: row.submitted_at,
    updated_at: row.updated_at,
    reviewed_at: row.reviewed_at,
    reviewed_by: row.reviewed_by,
    note: row.note,
    review_note: row.review_note,
    user: {
      id: row.user_id,
      discord_id: row.discord_id,
      discord_name: row.discord_name,
      display_name: row.display_name,
      avatar: row.avatar,
    },
  };
}

function getSelfRegistrationCapabilities(
  tournament: TournamentRow,
  registration: TournamentRegistrationRow | null,
): TournamentRegistrationSelfCapabilities {
  const beforeActive =
    tournament.status === 'draft' || tournament.status === 'signup';

  const canCreate =
    beforeActive &&
    tournament.status === 'signup' &&
    tournament.registrations_open === 1 &&
    registration == null;

  const canEdit =
    beforeActive &&
    tournament.status === 'signup' &&
    tournament.registrations_open === 1 &&
    registration?.status === 'pending';

  const canWithdraw =
    beforeActive &&
    tournament.status === 'signup' &&
    tournament.registrations_open === 1 &&
    !!registration &&
    (registration.status === 'pending' || registration.status === 'approved');

  return {
    can_create: canCreate,
    can_edit: canEdit,
    can_withdraw: canWithdraw,
  };
}

async function getRegistrationByUserId(
  c: any,
  tournamentId: number,
  userId: number,
): Promise<TournamentRegistrationRow | null> {
  const row = await c.env.DB.prepare(
    `SELECT *
     FROM tournament_registrations
     WHERE tournament_id = ? AND user_id = ?
     LIMIT 1`,
  ).bind(tournamentId, userId).first();

  return (row as TournamentRegistrationRow | null) ?? null;
}

async function assertAoeIdAvailable(
  c: any,
  tournamentId: number,
  aoeId: string,
  excludedUserId?: number,
) {
  let sql = `
    SELECT user_id
    FROM tournament_registrations
    WHERE tournament_id = ?
      AND aoe_id = ?`;

  const params: Array<number | string> = [tournamentId, aoeId];

  if (excludedUserId != null) {
    sql += ` AND user_id != ?`;
    params.push(excludedUserId);
  }

  sql += ` LIMIT 1`;

  const row = await c.env.DB.prepare(sql).bind(...params).first();
  const typedRow = row as { user_id: number } | null;

  if (typedRow) {
    httpError(409, 'This AoE profile is already registered for the tournament');
  }
}

tournaments.get('/', optionalUser, async (c) => {
  const user = c.get('user');

  const isGlobalAdmin = user?.is_admin === 1;
  const userId = user?.id ?? null;

  const sql = `
    SELECT t.id, t.slug, t.name, t.description, t.status, t.default_ruleset, t.starts_at, t.ends_at, t.created_at, t.registrations_open, t.recent_games_days,
      CASE
        WHEN ? = 1 THEN 1
        WHEN ta.role = 'admin' THEN 1
        ELSE 0
      END AS can_edit,

      CASE
        WHEN ? = 1 THEN 1
        ELSE 0
      END AS can_delete

    FROM tournaments t
    LEFT JOIN tournament_admins ta
      ON ta.tournament_id = t.id
      AND ta.user_id = ?

    WHERE
      t.status != 'draft'
      OR ? = 1
      OR ta.role IN ('admin', 'moderator')

    ORDER BY
      CASE t.status
        WHEN 'draft' THEN 1
        WHEN 'signup' THEN 2
        WHEN 'active' THEN 3
        WHEN 'completed' THEN 4
        WHEN 'archived' THEN 5
        ELSE 99
      END,
      t.created_at DESC`;

  const rows = await c.env.DB.prepare(sql)
    .bind(isGlobalAdmin ? 1 : 0, isGlobalAdmin ? 1 : 0, userId, isGlobalAdmin ? 1 : 0)
    .all();

  const tournaments =
    (rows.results ?? []).map((row: any) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      status: row.status,
      default_ruleset: row.default_ruleset,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      created_at: row.created_at,
      registrations_open: row.registrations_open,
      recent_games_days: row.recent_games_days,
      capabilities: {
        can_edit: row.can_edit === 1,
        can_delete: row.can_delete === 1,
      },
    }));

  return c.json({ tournaments });
});

tournaments.get('/:slug', optionalUser, withTournamentBySlug, withTournamentAccess, async (c) => {
  const user = c.get('user');
  const tournament = c.get('tournament');
  const tournamentRole = c.get('tournamentRole');
  const isTournamentStreamer = c.get('isTournamentStreamer');
  const isTournamentPlayer = c.get('isTournamentPlayer');

  const capabilities = {
    can_manage_tournament: await can(c, 'tournament.update'),
    can_manage_players: await can(c, 'player.manage'),
    can_assign_admins: await can(c, 'admin.assign'),
    can_assign_streamers: await can(c, 'streamer.assign'),
    can_manage_matches: await can(c, 'match.manage'),
    can_access_streamer_tools: await can(c, 'streamer.manage'),
  };

  const viewer = {
    is_authenticated: !!user,
    is_global_admin: user?.is_admin === 1,
    tournament_role: tournamentRole,
    is_tournament_streamer: isTournamentStreamer,
    is_tournament_player: isTournamentPlayer,
  };

  return c.json({
    tournament,
    viewer,
    capabilities,
  });
});

tournaments.put('/:slug', requireUser, withTournamentBySlug, withTournamentAccess, withTournamentAccess, requirePermission('tournament.update'), async (c) => {
  const slug = c.req.param('slug');
  const body = await c.req.json<{ name?: string; description?: string | null; default_ruleset: number | null; status?: string; starts_at?: string | null; ends_at?: string | null }>();

  await c.env.DB.prepare(
    `UPDATE tournaments
     SET name = coalesce(?, name), description = ?, status = coalesce(?, status), default_ruleset = ?, starts_at = ?, ends_at = ?
     WHERE slug = ?`,
  ).bind(
    body.name ?? null,
    body.description ?? null,
    body.status ?? null,
    body.default_ruleset ?? null,
    body.starts_at ?? null,
    body.ends_at ?? null,
    slug,
  ).run();

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
  if (!Number.isInteger(divisionId) || divisionId <= 0) httpError(400, 'Invalid division id');

  const row = await c.env.DB.prepare(`SELECT * FROM divisions WHERE id = ? AND tournament_id = ? LIMIT 1`).bind(divisionId, t.id).first();
  if (!row) httpError(404, 'Division not found');

  return c.json({ division: row });
});

tournaments.post('/:slug/divisions', requireUser, withTournamentBySlug, withTournamentAccess, withTournamentAccess, requirePermission('division.manage'), async (c) => {
  const t = c.get('tournament')!;
  const body = await c.req.json<{ name?: string; ruleset_id?: number | null }>();
  if (!body.name) httpError(400, 'name is required');

  await c.env.DB.prepare(`INSERT INTO divisions (tournament_id, name, ruleset_id) VALUES (?, ?, ?)`).bind(t.id, body.name, body.ruleset_id ?? null).run();

  return c.json({ ok: true }, 201);
});

tournaments.put('/:slug/divisions/:divisionId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('division.manage'), async (c) => {
  const t = c.get('tournament')!;
  const divisionId = Number(c.req.param('divisionId'));
  if (!Number.isInteger(divisionId) || divisionId <= 0) httpError(400, 'Invalid division id');
  const body = await c.req.json<{ name?: string; ruleset_id?: number | null }>();

  await c.env.DB.prepare(`UPDATE divisions SET name = coalesce(?, name), ruleset_id = ? WHERE id = ? AND tournament_id = ?`)
    .bind(body.name ?? null, body.ruleset_id ?? null, divisionId, t.id).run();

  return c.json({ ok: true });
});

tournaments.delete('/:slug/divisions/:divisionId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('division.manage'), async (c) => {
  const t = c.get('tournament')!;
  const divisionId = Number(c.req.param('divisionId'));
  if (!Number.isInteger(divisionId) || divisionId <= 0) httpError(400, 'Invalid division id');

  const result = await c.env.DB.prepare(`DELETE FROM divisions WHERE id = ? AND tournament_id = ?`).bind(divisionId, t.id).run();
  if ((result.meta.changes ?? 0) === 0) httpError(404, 'Division not found');

  return c.json({ ok: true });
});

tournaments.get('/:slug/divisions/:divisionId/ruleset', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;
  const divisionId = Number(c.req.param('divisionId'));
  if (!Number.isInteger(divisionId) || divisionId <= 0) httpError(400, 'Invalid division id');

  return c.json({
    division_ruleset: await getDivisionRulesetDto(c.env, {
      tournamentId: t.id,
      divisionId,
    }),
  });
});

tournaments.get('/:slug/divisions/:divisionId/standings', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;
  const divisionId = Number(c.req.param('divisionId'));
  if (!Number.isInteger(divisionId) || divisionId <= 0) httpError(400, 'Invalid division id');

  const stageId = c.req.query('stageId') ?? null;

  return c.json({
    standings_view: await getDivisionStandingsDto(c.env, {
      tournamentId: t.id,
      divisionId,
      stageId,
    }),
  });
});

tournaments.get('/:slug/divisions/:divisionId/stages/:stageId/preview', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;
  const divisionId = Number(c.req.param('divisionId'));
  if (!Number.isInteger(divisionId) || divisionId <= 0) httpError(400, 'Invalid division id');

  return c.json({
    stage_preview: await getStagePreviewDto(c.env, {
      tournamentId: t.id,
      divisionId,
      stageId: c.req.param('stageId'),
    }),
  });
});

tournaments.get('/:slug/divisions/:divisionId/match-format-preview', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;
  const divisionId = Number(c.req.param('divisionId'));
  if (!Number.isInteger(divisionId) || divisionId <= 0) httpError(400, 'Invalid division id');

  const stageId = c.req.query('stageId');
  if (!stageId) httpError(400, 'stageId is required');

  const roundNumberRaw = c.req.query('roundNumber');
  let roundNumber: number | null = null;

  if (roundNumberRaw) {
    roundNumber = Number(roundNumberRaw);

    if (!Number.isInteger(roundNumber) || roundNumber <= 0) {
      httpError(400, 'roundNumber must be a positive integer');
    }
  }

  const roundLabel = c.req.query('roundLabel') ?? null;

  return c.json({
    match_format_preview: await getMatchFormatPreviewDto(c.env, {
      tournamentId: t.id,
      divisionId,
      stageId,
      roundNumber,
      roundLabel,
    }),
  });
});

// admins

tournaments.get('/:slug/admins', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;

  const rows = await c.env.DB.prepare(
    `SELECT ta.user_id, ta.role, u.discord_id, u.discord_name, u.display_name, u.avatar
     FROM tournament_admins ta
     JOIN users u ON u.id = ta.user_id
     WHERE ta.tournament_id = ?
     ORDER BY ta.role ASC, u.display_name ASC, u.discord_name ASC`,
  ).bind(t.id).all();

  return c.json({ admins: rows.results ?? [] });
});

tournaments.post('/:slug/admins', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('admin.assign'), async (c) => {
  const t = c.get('tournament')!;
  const body = await c.req.json<{ user_id?: number; role?: 'admin' | 'moderator' }>();
  if (!body.user_id || !body.role) httpError(400, 'user_id and role are required');

  await c.env.DB.prepare(
    `INSERT INTO tournament_admins (tournament_id, user_id, role) VALUES (?, ?, ?)
     ON CONFLICT(tournament_id, user_id) DO UPDATE SET role = excluded.role`,
  ).bind(t.id, body.user_id, body.role).run();

  return c.json({ ok: true }, 201);
});

tournaments.put('/:slug/admins/:userId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('admin.assign'), async (c) => {
  const t = c.get('tournament')!;
  const userId = Number(c.req.param('userId'));
  if (!Number.isInteger(userId) || userId <= 0) httpError(400, 'Invalid user id');
  const body = await c.req.json<{ role?: 'admin' | 'moderator' }>();
  if (!body.role) httpError(400, 'role is required');

  await c.env.DB.prepare(`UPDATE tournament_admins SET role = ? WHERE tournament_id = ? AND user_id = ?`).bind(body.role, t.id, userId).run();

  return c.json({ ok: true });
});

tournaments.delete('/:slug/admins/:userId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('admin.assign'), async (c) => {
  const t = c.get('tournament')!;
  const userId = Number(c.req.param('userId'));
  if (!Number.isInteger(userId) || userId <= 0) httpError(400, 'Invalid user id');

  const result = await c.env.DB.prepare(`DELETE FROM tournament_admins WHERE tournament_id = ? AND user_id = ?`).bind(t.id, userId).run();
  if ((result.meta.changes ?? 0) === 0) httpError(404, 'Admin user not found');

  return c.json({ ok: true });
});

// streamers

tournaments.get('/:slug/streamers', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;

  const rows = await c.env.DB.prepare(
    `SELECT ts.user_id, ts.stream_url,
            u.discord_id, u.discord_name, u.display_name, u.avatar
     FROM tournament_streamers ts
     JOIN users u ON u.id = ts.user_id
     WHERE ts.tournament_id = ?
     ORDER BY coalesce(u.display_name, u.discord_name) ASC`,
  ).bind(t.id).all();

  return c.json({ streamers: rows.results ?? [] });
});

tournaments.post('/:slug/streamers', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('streamer.assign'), async (c) => {
  const t = c.get('tournament')!;
  const body = await c.req.json<{ user_id?: number; display_name?: string | null; stream_url?: string | null; language?: string | null }>();

  if (!body.user_id) httpError(400, 'user_id is required');

  await c.env.DB.prepare(
    `INSERT INTO tournament_streamers (tournament_id, user_id, stream_url)
     VALUES (?, ?, ?)
     ON CONFLICT(tournament_id, user_id) DO UPDATE SET
       stream_url = excluded.stream_url`,
  ).bind(t.id, body.user_id, body.stream_url ?? null).run();

  return c.json({ ok: true }, 201);
});

tournaments.put('/:slug/streamers/:userId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('streamer.manage'), async (c) => {
  const t = c.get('tournament')!;
  const userId = Number(c.req.param('userId'));
  if (!Number.isInteger(userId) || userId <= 0) httpError(400, 'Invalid user id');
  const body = await c.req.json<{ display_name?: string | null; stream_url?: string | null; language?: string | null }>();

  await c.env.DB.prepare(
    `UPDATE tournament_streamers
     SET stream_url = ?
     WHERE tournament_id = ? AND user_id = ?`,
  ).bind(body.stream_url ?? null, t.id, userId).run();

  return c.json({ ok: true });
});

tournaments.delete('/:slug/streamers/:userId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('streamer.assign'), async (c) => {
  const t = c.get('tournament')!;
  const userId = Number(c.req.param('userId'));
  if (!Number.isInteger(userId) || userId <= 0) httpError(400, 'Invalid user id');

  const result = await c.env.DB.prepare(`DELETE FROM tournament_streamers WHERE tournament_id = ? AND user_id = ?`).bind(t.id, userId).run();
  if ((result.meta.changes ?? 0) === 0) httpError(404, 'Streamer user not found');

  return c.json({ ok: true });
});

// registrations

tournaments.get('/:slug/registration/me', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('player.register'), async (c) => {
  const tournament = c.get('tournament')!;
  const user = c.get('user')!;

  assertRegistrationsAvailableForRead(tournament);

  const registration = await getRegistrationByUserId(c, tournament.id, user.id);

  return c.json({
    registration: registration ? toSelfRegistrationDto(registration) : null,
    capabilities: getSelfRegistrationCapabilities(tournament, registration),
  });
});

tournaments.post('/:slug/registration/me', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('player.register'), async (c) => {
  const tournament = c.get('tournament')!;
  const user = c.get('user')!;
  const body = await c.req.json<{ aoe2companion_url?: string; note?: string | null }>();

  assertRegistrationsAvailableForRead(tournament);
  assertSelfRegistrationWindow(tournament);

  if (!body.aoe2companion_url?.trim()) {
    httpError(400, 'aoe2companion_url is required');
  }

  const existing = await getRegistrationByUserId(c, tournament.id, user.id);

  if (existing && existing.status !== 'withdrawn' && existing.status !== 'rejected') {
    httpError(409, 'You already have a registration for this tournament');
  }

  const snapshot = await fetchRegistrationSnapshot(
    body.aoe2companion_url,
    tournament.recent_games_days as number,
  );

  await assertAoeIdAvailable(c, tournament.id, snapshot.aoeId, user.id);

  if (!existing) {
    await c.env.DB.prepare(
      `INSERT INTO tournament_registrations (
         tournament_id,
         user_id,
         aoe_id,
         aoe_name,
         signup_rating,
         signup_max_rating,
         signup_team_rating,
         signup_max_team_rating,
         current_rating,
         current_max_rating,
         current_team_rating,
         current_max_team_rating,
         current_data_fetched_at,
         total_games,
         recent_games,
         status,
         note
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, 'pending', ?)`,
    ).bind(
      tournament.id,
      user.id,
      snapshot.aoeId,
      snapshot.aoeName,
      snapshot.signupRating,
      snapshot.signupMaxRating,
      snapshot.signupTeamRating,
      snapshot.signupTeamMaxRating,
      snapshot.currentRating,
      snapshot.currentMaxRating,
      snapshot.currentTeamRating,
      snapshot.currentTeamMaxRating,
      snapshot.totalGames,
      snapshot.recentGames,
      body.note?.trim() || null,
    ).run();
  } else {
    await c.env.DB.prepare(
      `UPDATE tournament_registrations
       SET aoe_id = ?,
           aoe_name = ?,
           signup_rating = ?,
           signup_max_rating = ?,
           signup_team_rating = ?,
           signup_max_team_rating = ?,
           current_rating = ?,
           current_max_rating = ?,
           current_team_rating = ?,
           current_max_team_rating = ?,
           current_data_fetched_at = datetime('now'),
           total_games = ?,
           recent_games = ?,
           status = 'pending',
           submitted_at = datetime('now'),
           updated_at = datetime('now'),
           reviewed_at = NULL,
           reviewed_by = NULL,
           note = ?,
           review_note = NULL
       WHERE tournament_id = ? AND user_id = ?`,
    ).bind(
      snapshot.aoeId,
      snapshot.aoeName,
      snapshot.signupRating,
      snapshot.signupMaxRating,
      snapshot.signupTeamRating,
      snapshot.signupTeamMaxRating,
      snapshot.currentRating,
      snapshot.currentMaxRating,
      snapshot.currentTeamRating,
      snapshot.currentTeamMaxRating,
      snapshot.totalGames,
      snapshot.recentGames,
      body.note?.trim() || null,
      tournament.id,
      user.id,
    ).run();
  }

  const registration = await getRegistrationByUserId(c, tournament.id, user.id);
  if (!registration) {
    httpError(500, 'Failed to load registration after save');
  }

  return c.json(
    {
      ok: true,
      registration: toSelfRegistrationDto(registration),
      capabilities: getSelfRegistrationCapabilities(tournament, registration),
    },
    201,
  );
});

tournaments.put('/:slug/registration/me', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('player.register'), async (c) => {
  const tournament = c.get('tournament')!;
  const user = c.get('user')!;
  const body = await c.req.json<{ aoe2companion_url?: string; note?: string | null }>();

  assertRegistrationsAvailableForRead(tournament);
  assertSelfRegistrationWindow(tournament);

  if (!body.aoe2companion_url?.trim()) {
    httpError(400, 'aoe2companion_url is required');
  }

  const existing = await getRegistrationByUserId(c, tournament.id, user.id);
  if (!existing) {
    httpError(404, 'Registration not found');
  }

  if (existing.status !== 'pending') {
    httpError(409, 'Only pending registrations can be edited');
  }

  const snapshot = await fetchRegistrationSnapshot(
    body.aoe2companion_url,
    tournament.recent_games_days as number,
  );

  await assertAoeIdAvailable(c, tournament.id, snapshot.aoeId, user.id);

  await c.env.DB.prepare(
    `UPDATE tournament_registrations
     SET aoe_id = ?,
         aoe_name = ?,
         signup_rating = ?,
         signup_max_rating = ?,
         signup_team_rating = ?,
         signup_max_team_rating = ?,
         current_rating = ?,
         current_max_rating = ?,
         current_team_rating = ?,
         current_max_team_rating = ?,
         current_data_fetched_at = datetime('now'),
         total_games = ?,
         recent_games = ?,
         note = ?,
         updated_at = datetime('now')
     WHERE tournament_id = ? AND user_id = ?`,
  ).bind(
    snapshot.aoeId,
    snapshot.aoeName,
    snapshot.signupRating,
    snapshot.signupMaxRating,
    snapshot.signupTeamRating,
    snapshot.signupTeamMaxRating,
    snapshot.currentRating,
    snapshot.currentMaxRating,
    snapshot.currentTeamRating,
    snapshot.currentTeamMaxRating,
    snapshot.totalGames,
    snapshot.recentGames,
    body.note?.trim() || null,
    tournament.id,
    user.id,
  ).run();

  const registration = await getRegistrationByUserId(c, tournament.id, user.id);
  if (!registration) {
    httpError(500, 'Failed to load registration after update');
  }

  return c.json({
    ok: true,
    registration: toSelfRegistrationDto(registration),
    capabilities: getSelfRegistrationCapabilities(tournament, registration),
  });
});

tournaments.post('/:slug/registration/me/withdraw', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('player.register'), async (c) => {
  const tournament = c.get('tournament')!;
  const user = c.get('user')!;

  assertRegistrationsAvailableForRead(tournament);
  assertSelfRegistrationWindow(tournament);

  const existing = await getRegistrationByUserId(c, tournament.id, user.id);
  if (!existing) {
    httpError(404, 'Registration not found');
  }

  if (existing.status !== 'pending' && existing.status !== 'approved') {
    httpError(409, 'This registration cannot be withdrawn');
  }

  await c.env.DB.prepare(
    `UPDATE tournament_registrations
     SET status = 'withdrawn',
         updated_at = datetime('now')
     WHERE tournament_id = ? AND user_id = ?`,
  ).bind(tournament.id, user.id).run();

  const registration = await getRegistrationByUserId(c, tournament.id, user.id);
  if (!registration) {
    httpError(500, 'Failed to load registration after withdrawal');
  }

  return c.json({
    ok: true,
    registration: toSelfRegistrationDto(registration),
    capabilities: getSelfRegistrationCapabilities(tournament, registration),
  });
});

tournaments.get('/:slug/registrations', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('player.review'), async (c) => {
  const tournament = c.get('tournament')!;

  assertRegistrationsAvailableForRead(tournament);

  const rows = await c.env.DB.prepare(
    `SELECT tr.*,
            u.discord_id,
            u.discord_name,
            u.display_name,
            u.avatar
     FROM tournament_registrations tr
     JOIN users u ON u.id = tr.user_id
     WHERE tr.tournament_id = ?
     ORDER BY
       (tr.current_rating IS NULL) ASC,
       tr.current_rating DESC,
       (tr.current_max_rating IS NULL) ASC,
       tr.current_max_rating DESC,
       tr.user_id ASC`,
  ).bind(tournament.id).all();

  const registrations = ((rows.results ?? []) as TournamentRegistrationStaffRow[]).map(
    toStaffRegistrationDto,
  );

  return c.json({ registrations });
});

tournaments.post('/:slug/registrations', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('player.manage'), async (c) => {
  const tournament = c.get('tournament')!;
  const body = await c.req.json<{ user_id?: number; aoe2companion_url?: string; note?: string | null }>();

  assertRegistrationsAvailableForRead(tournament);
  assertAdminCreateWindow(tournament);

  if (!body.user_id || !Number.isInteger(body.user_id) || body.user_id <= 0) {
    httpError(400, 'user_id is required');
  }

  if (!body.aoe2companion_url?.trim()) {
    httpError(400, 'aoe2companion_url is required');
  }

  const snapshot = await fetchRegistrationSnapshot(
    body.aoe2companion_url,
    tournament.recent_games_days as number,
  );

  await assertAoeIdAvailable(c, tournament.id, snapshot.aoeId, body.user_id);

  const existing = await getRegistrationByUserId(c, tournament.id, body.user_id);

  if (existing && existing.status !== 'withdrawn' && existing.status !== 'rejected') {
    httpError(409, 'That user already has a registration for this tournament');
  }

  if (!existing) {
    await c.env.DB.prepare(
      `INSERT INTO tournament_registrations (
         tournament_id,
         user_id,
         aoe_id,
         aoe_name,
         signup_rating,
         signup_max_rating,
         signup_team_rating,
         signup_max_team_rating,
         current_rating,
         current_max_rating,
         current_team_rating,
         current_max_team_rating,
         current_data_fetched_at,
         total_games,
         recent_games,
         status,
         note
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, 'pending', ?)`,
    ).bind(
      tournament.id,
      body.user_id,
      snapshot.aoeId,
      snapshot.aoeName,
      snapshot.signupRating,
      snapshot.signupMaxRating,
      snapshot.signupTeamRating,
      snapshot.signupTeamMaxRating,
      snapshot.currentRating,
      snapshot.currentMaxRating,
      snapshot.currentTeamRating,
      snapshot.currentTeamMaxRating,
      snapshot.totalGames,
      snapshot.recentGames,
      body.note?.trim() || null,
    ).run();
  } else {
    await c.env.DB.prepare(
      `UPDATE tournament_registrations
       SET aoe_id = ?,
           aoe_name = ?,
           signup_rating = ?,
           signup_max_rating = ?,
           signup_team_rating = ?,
           signup_max_team_rating = ?,
           current_rating = ?,
           current_max_rating = ?,
           current_team_rating = ?,
           current_max_team_rating = ?,
           current_data_fetched_at = datetime('now'),
           total_games = ?,
           recent_games = ?,
           status = 'pending',
           submitted_at = datetime('now'),
           updated_at = datetime('now'),
           reviewed_at = NULL,
           reviewed_by = NULL,
           note = ?,
           review_note = NULL
       WHERE tournament_id = ? AND user_id = ?`,
    ).bind(
      snapshot.aoeId,
      snapshot.aoeName,
      snapshot.signupRating,
      snapshot.signupMaxRating,
      snapshot.signupTeamRating,
      snapshot.signupTeamMaxRating,
      snapshot.currentRating,
      snapshot.currentMaxRating,
      snapshot.currentTeamRating,
      snapshot.currentTeamMaxRating,
      snapshot.totalGames,
      snapshot.recentGames,
      body.note?.trim() || null,
      tournament.id,
      body.user_id,
    ).run();
  }

  const registration = await getRegistrationByUserId(c, tournament.id, body.user_id);
  if (!registration) {
    httpError(500, 'Failed to load registration after save');
  }

  const row = await c.env.DB.prepare(
    `SELECT tr.*,
            u.discord_id,
            u.discord_name,
            u.display_name,
            u.avatar
     FROM tournament_registrations tr
     JOIN users u ON u.id = tr.user_id
     WHERE tr.tournament_id = ? AND tr.user_id = ?
     LIMIT 1`,
  ).bind(tournament.id, body.user_id).first();

  return c.json(
    {
      ok: true,
      registration: toStaffRegistrationDto(row as TournamentRegistrationStaffRow),
    },
    201,
  );
});

tournaments.post('/:slug/registrations/refresh', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('player.review'), async (c) => {
  const tournament = c.get('tournament')!;

  assertRegistrationsAvailableForRead(tournament);

  if (
    !Number.isInteger(tournament.recent_games_days) ||
    (tournament.recent_games_days ?? 0) <= 0
  ) {
    httpError(409, 'Tournament registration settings are incomplete');
  }

  const rows = await c.env.DB.prepare(
    `SELECT *
     FROM tournament_registrations
     WHERE tournament_id = ?
     ORDER BY user_id ASC`,
  ).bind(tournament.id).all();

  const registrations = (rows.results ?? []) as TournamentRegistrationRow[];

  for (const registration of registrations) {
    const snapshot = await fetchRegistrationSnapshot(
      `https://www.aoe2companion.com/players/${registration.aoe_id}`,
      tournament.recent_games_days as number,
    );

    await c.env.DB.prepare(
      `UPDATE tournament_registrations
       SET current_rating = ?,
           current_max_rating = ?,
           current_team_rating = ?,
           current_max_team_rating = ?,
           current_data_fetched_at = datetime('now'),
           total_games = ?,
           recent_games = ?
       WHERE tournament_id = ? AND user_id = ?`,
    ).bind(
      snapshot.currentRating,
      snapshot.currentMaxRating,
      snapshot.currentTeamRating,
      snapshot.currentTeamMaxRating,
      snapshot.totalGames,
      snapshot.recentGames,
      tournament.id,
      registration.user_id,
    ).run();
  }

  const updatedRows = await c.env.DB.prepare(
    `SELECT tr.*,
            u.discord_id,
            u.discord_name,
            u.display_name,
            u.avatar
     FROM tournament_registrations tr
     JOIN users u ON u.id = tr.user_id
     WHERE tr.tournament_id = ?
     ORDER BY
       (tr.current_rating IS NULL) ASC,
       tr.current_rating DESC,
       (tr.current_max_rating IS NULL) ASC,
       tr.current_max_rating DESC,
       tr.user_id ASC`,
  ).bind(tournament.id).all();

  const updatedRegistrations = ((updatedRows.results ?? []) as TournamentRegistrationStaffRow[]).map(
    toStaffRegistrationDto,
  );

  return c.json({
    ok: true,
    registrations: updatedRegistrations,
  });
});

tournaments.post('/:slug/registrations/:userId/refresh', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('player.review'), async (c) => {
  const tournament = c.get('tournament')!;
  const userId = assertValidUserId(c.req.param('userId'));

  assertRegistrationsAvailableForRead(tournament);

  if (
    !Number.isInteger(tournament.recent_games_days) ||
    (tournament.recent_games_days ?? 0) <= 0
  ) {
    httpError(409, 'Tournament registration settings are incomplete');
  }

  const existing = await getRegistrationByUserId(c, tournament.id, userId);
  if (!existing) {
    httpError(404, 'Registration not found');
  }

  const snapshot = await fetchRegistrationSnapshot(
    `https://www.aoe2companion.com/players/${existing.aoe_id}`,
    tournament.recent_games_days as number,
  );

  await c.env.DB.prepare(
    `UPDATE tournament_registrations
     SET current_rating = ?,
         current_max_rating = ?,
         current_team_rating = ?,
         current_max_team_rating = ?,
         current_data_fetched_at = datetime('now'),
         total_games = ?,
         recent_games = ?
     WHERE tournament_id = ? AND user_id = ?`,
  ).bind(
    snapshot.currentRating,
    snapshot.currentMaxRating,
    snapshot.currentTeamRating,
    snapshot.currentTeamMaxRating,
    snapshot.totalGames,
    snapshot.recentGames,
    tournament.id,
    userId,
  ).run();

  const updated = await c.env.DB.prepare(
    `SELECT tr.*,
            u.discord_id,
            u.discord_name,
            u.display_name,
            u.avatar
     FROM tournament_registrations tr
     JOIN users u ON u.id = tr.user_id
     WHERE tr.tournament_id = ? AND tr.user_id = ?
     LIMIT 1`,
  ).bind(tournament.id, userId).first();

  return c.json({
    ok: true,
    registration: toStaffRegistrationDto(updated as TournamentRegistrationStaffRow),
  });
});

tournaments.post('/:slug/registrations/:userId/review', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('player.review'), async (c) => {
  const tournament = c.get('tournament')!;
  const reviewer = c.get('user')!;
  const userId = assertValidUserId(c.req.param('userId'));
  const body = await c.req.json<{ status?: 'pending' | 'approved' | 'rejected'; review_note?: string | null }>();

  assertRegistrationsAvailableForRead(tournament);

  if (!body.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
    httpError(400, 'status must be one of pending, approved, rejected');
  }

  const existing = await getRegistrationByUserId(c, tournament.id, userId);
  if (!existing) {
    httpError(404, 'Registration not found');
  }

  await c.env.DB.prepare(
    `UPDATE tournament_registrations
     SET status = ?,
         review_note = ?,
         reviewed_at = datetime('now'),
         reviewed_by = ?,
         updated_at = datetime('now')
     WHERE tournament_id = ? AND user_id = ?`,
  ).bind(
    body.status,
    body.review_note?.trim() || null,
    reviewer.id,
    tournament.id,
    userId,
  ).run();

  const updated = await c.env.DB.prepare(
    `SELECT tr.*,
            u.discord_id,
            u.discord_name,
            u.display_name,
            u.avatar
     FROM tournament_registrations tr
     JOIN users u ON u.id = tr.user_id
     WHERE tr.tournament_id = ? AND tr.user_id = ?
     LIMIT 1`,
  ).bind(tournament.id, userId).first();

  return c.json({
    ok: true,
    registration: toStaffRegistrationDto(updated as TournamentRegistrationStaffRow),
  });
});

tournaments.put('/:slug/registration-settings', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('tournament.update'), async (c) => {
  const tournament = c.get('tournament')!;
  const body = await c.req.json<{ registrations_open?: boolean; recent_games_days?: number | null }>();

  if (tournament.status !== 'signup') {
    httpError(409, 'Registration settings can only be changed while tournament is in signup status');
  }

  if (body.registrations_open == null && body.recent_games_days === undefined) {
    httpError(400, 'At least one registration setting must be provided');
  }

  const nextRegistrationsOpen =
    body.registrations_open == null
      ? tournament.registrations_open === 1
      : body.registrations_open;

  const nextRecentGamesDays =
    body.recent_games_days === undefined
      ? tournament.recent_games_days
      : body.recent_games_days;

  if (
    nextRegistrationsOpen &&
    (!Number.isInteger(nextRecentGamesDays) || (nextRecentGamesDays ?? 0) <= 0)
  ) {
    httpError(400, 'recent_games_days must be set to a positive integer before opening registrations');
  }

  await c.env.DB.prepare(
    `UPDATE tournaments
     SET registrations_open = ?,
         recent_games_days = ?
     WHERE id = ?`,
  ).bind(
    nextRegistrationsOpen ? 1 : 0,
    nextRecentGamesDays ?? null,
    tournament.id,
  ).run();

  const updatedTournament = await c.env.DB.prepare(
    `SELECT * FROM tournaments WHERE id = ? LIMIT 1`,
  ).bind(tournament.id).first();

  const typedTournament = updatedTournament as TournamentRow | null;

  return c.json({
    ok: true,
    registration_settings: {
      registrations_open: typedTournament?.registrations_open === 1,
      recent_games_days: typedTournament?.recent_games_days ?? null,
    },
  });
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
     ORDER BY tp.id ASC`,
  ).bind(t.id).all();

  return c.json({ players: rows.results ?? [] });
});

tournaments.get('/:slug/players/:playerId', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;
  const playerId = Number(c.req.param('playerId'));
  if (!Number.isInteger(playerId) || playerId <= 0) httpError(400, 'Invalid player id');

  const row = await c.env.DB.prepare(
    `SELECT tp.*, u.discord_id, u.discord_name, u.display_name, u.avatar, d.name as division_name
     FROM tournament_players tp
     JOIN users u ON u.id = tp.user_id
     LEFT JOIN divisions d ON d.id = tp.division_id
     WHERE tp.id = ? AND tp.tournament_id = ? LIMIT 1`,
  ).bind(playerId, t.id).first();
  if (!row) httpError(404, 'Tournament player not found');

  return c.json({ player: row });
});

tournaments.post('/:slug/players', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('player.register'), async (c) => {
  const t = c.get('tournament')!;
  const user = c.get('user')!;
  const body = await c.req.json<{ user_id?: number; division_id?: number | null; aoe_id?: string; seed?: number | null; status?: string }>();
  if (!body.aoe_id) httpError(400, 'aoe_id is required');

  const actingAsSelf = !body.user_id || body.user_id === user.id;
  const userId = actingAsSelf ? user.id : body.user_id;
  if (!actingAsSelf) {
    const allowed = await can(c, 'player.manage');
    if (!allowed) httpError(403, 'Forbidden');
  }

  await c.env.DB.prepare(
    `INSERT INTO tournament_players (tournament_id, user_id, division_id, aoe_id, seed, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(
    t.id,
    userId,
    body.division_id ?? null,
    body.aoe_id,
    body.seed ?? null,
    actingAsSelf ? 'pending' : (body.status ?? 'active'),
  ).run();

  return c.json({ ok: true }, 201);
});

tournaments.put('/:slug/players/:playerId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('player.manage'), async (c) => {
  const t = c.get('tournament')!;
  const playerId = Number(c.req.param('playerId'));
  if (!Number.isInteger(playerId) || playerId <= 0) httpError(400, 'Invalid player id');
  const body = await c.req.json<{ division_id?: number | null; seed?: number | null; status?: string; aoe_id?: string }>();

  await c.env.DB.prepare(
    `UPDATE tournament_players
     SET division_id = ?, seed = ?, status = coalesce(?, status), aoe_id = coalesce(?, aoe_id)
     WHERE id = ? AND tournament_id = ?`,
  ).bind(
    body.division_id ?? null,
    body.seed ?? null,
    body.status ?? null,
    body.aoe_id ?? null,
    playerId,
    t.id,
  ).run();

  return c.json({ ok: true });
});

tournaments.delete('/:slug/players/:playerId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('player.manage'), async (c) => {
  const t = c.get('tournament')!;
  const playerId = Number(c.req.param('playerId'));
  if (!Number.isInteger(playerId) || playerId <= 0) httpError(400, 'Invalid player id');

  const result = await c.env.DB.prepare(`DELETE FROM tournament_players WHERE id = ? AND tournament_id = ?`).bind(playerId, t.id).run();
  if ((result.meta.changes ?? 0) === 0) httpError(404, 'Player not found');

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
  if (divisionId) {
    sql += ` AND division_id = ?`;
    params.push(Number(divisionId));
  }
  if (week) {
    sql += ` AND week_number = ?`;
    params.push(Number(week));
  }
  if (state) {
    sql += ` AND state = ?`;
    params.push(state);
  }
  sql += ` ORDER BY coalesce(week_number, 0), id`;
  const rows = await c.env.DB.prepare(sql).bind(...params).all();

  return c.json({ matches: rows.results ?? [] });
});

tournaments.get('/:slug/matches/:matchId', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;
  const matchId = Number(c.req.param('matchId'));
  if (!Number.isInteger(matchId) || matchId <= 0) httpError(400, 'Invalid match id');

  const row = await c.env.DB.prepare(`SELECT * FROM matches WHERE id = ? AND tournament_id = ? LIMIT 1`).bind(matchId, t.id).first();
  if (!row) httpError(404, 'Match not found');

  return c.json({ match: row });
});

tournaments.post('/:slug/matches', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('match.manage'), async (c) => {
  const t = c.get('tournament')!;
  const body = await c.req.json<{ division_id?: number; stage?: string; round_number?: number | null; week_number?: number | null; player1_id?: number; player2_id?: number; scheduled_for?: string | null; state?: string }>();
  if (!body.division_id || !body.player1_id || !body.player2_id) {
    httpError(400, 'division_id, player1_id and player2_id are required');
  }

  await c.env.DB.prepare(
    `INSERT INTO matches (tournament_id, division_id, stage, round_number, week_number, player1_id, player2_id, scheduled_for, state)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    t.id,
    body.division_id,
    body.stage ?? 'group',
    body.round_number ?? null,
    body.week_number ?? null,
    body.player1_id,
    body.player2_id,
    body.scheduled_for ?? null,
    body.state ?? 'created',
  ).run();

  return c.json({ ok: true }, 201);
});

tournaments.put('/:slug/matches/:matchId', requireUser, withTournamentBySlug, withTournamentAccess, async (c) => {
  const t = c.get('tournament')!;
  const matchId = Number(c.req.param('matchId'));
  if (!Number.isInteger(matchId) || matchId <= 0) httpError(400, 'Invalid match id');
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
       WHERE id = ? AND tournament_id = ?`,
    ).bind(
      body.scheduled_for ?? null,
      body.state ?? null,
      body.player1_points ?? null,
      body.player2_points ?? null,
      body.played_on ?? null,
      matchId,
      t.id,
    ).run();
  } else {
    await c.env.DB.prepare(
      `UPDATE matches SET scheduled_for = ?, state = coalesce(?, state) WHERE id = ? AND tournament_id = ?`,
    ).bind(
      body.scheduled_for ?? null,
      body.state ?? null,
      matchId,
      t.id,
    ).run();
  }

  return c.json({ ok: true });
});

tournaments.delete('/:slug/matches/:matchId', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('match.manage'), async (c) => {
  const t = c.get('tournament')!;
  const matchId = Number(c.req.param('matchId'));
  if (!Number.isInteger(matchId) || matchId <= 0) httpError(400, 'Invalid match id');

  const result = await c.env.DB.prepare(`DELETE FROM matches WHERE id = ? AND tournament_id = ?`).bind(matchId, t.id).run();
  if ((result.meta.changes ?? 0) === 0) httpError(404, 'Match not found');

  return c.json({ ok: true });
});

// replays

tournaments.get('/:slug/matches/:matchId/replays', optionalUser, withTournamentBySlug, async (c) => {
  const t = c.get('tournament')!;
  const matchId = Number(c.req.param('matchId'));
  if (!Number.isInteger(matchId) || matchId <= 0) httpError(400, 'Invalid match id');

  const rows = await c.env.DB.prepare(`SELECT * FROM replays WHERE tournament_id = ? AND match_id = ? ORDER BY uploaded_at ASC`).bind(t.id, matchId).all();

  return c.json({ replays: rows.results ?? [] });
});

tournaments.post('/:slug/matches/:matchId/replays', requireUser, withTournamentBySlug, withTournamentAccess, requirePermission('replay.upload.own', (c) => ({ matchId: Number(c.req.param('matchId')) })), async (c) => {
  const t = c.get('tournament')!;
  const user = c.get('user')!;
  const matchId = Number(c.req.param('matchId'));
  if (!Number.isInteger(matchId) || matchId <= 0) httpError(400, 'Invalid match id');
  const body = await c.req.json<{ r2_object_key?: string; file_size_bytes?: number | null; content_hash?: string | null; original_filename?: string | null }>();
  if (!body.r2_object_key) httpError(400, 'r2_object_key is required');

  await c.env.DB.prepare(
    `INSERT INTO replays (match_id, tournament_id, uploaded_by, r2_object_key, file_size_bytes, content_hash, original_filename)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    matchId,
    t.id,
    user.id,
    body.r2_object_key,
    body.file_size_bytes ?? null,
    body.content_hash ?? null,
    body.original_filename ?? null,
  ).run();

  return c.json({ ok: true }, 201);
});

// match units

tournaments.get('/:slug/matches/:matchId/units', optionalUser, withTournamentBySlug, async (c) => {
  const matchId = Number(c.req.param('matchId'));
  if (!Number.isInteger(matchId) || matchId <= 0) httpError(400, 'Invalid match id');

  const rows = await c.env.DB.prepare(`SELECT * FROM match_units WHERE match_id = ? ORDER BY unit_index ASC`).bind(matchId).all();

  return c.json({ units: rows.results ?? [] });
});

tournaments.get('/:slug/matches/:matchId/units/:unitId', optionalUser, withTournamentBySlug, async (c) => {
  const matchId = Number(c.req.param('matchId'));
  if (!Number.isInteger(matchId) || matchId <= 0) httpError(400, 'Invalid match id');
  const unitId = Number(c.req.param('unitId'));
  if (!Number.isInteger(unitId) || unitId <= 0) httpError(400, 'Invalid unit id');

  const row = await c.env.DB.prepare(`SELECT * FROM match_units WHERE id = ? AND match_id = ? LIMIT 1`).bind(unitId, matchId).first();
  if (!row) httpError(404, 'Match unit not found');

  return c.json({ unit: row });
});

export default tournaments;