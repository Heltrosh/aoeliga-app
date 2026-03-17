import { Hono } from 'hono';
import type { AppBindings } from '../types/app';
import { requireUser } from '../lib/auth_session';
import { requirePermission } from '../lib/permissions';
import { httpError } from '../lib/http';

const admin = new Hono<AppBindings>();
admin.use('*', requireUser);
admin.use('*', requirePermission('platform.admin'));

admin.get('/users', async (c) => {
  const q = (c.req.query('q') ?? '').trim();
  const sql = q
    ? `SELECT id, discord_id, discord_name, display_name, avatar, is_admin, is_banned, ban_reason, created_at, last_login_at
       FROM users
       WHERE lower(coalesce(discord_name,'')) LIKE lower(?) OR lower(coalesce(display_name,'')) LIKE lower(?)
       ORDER BY coalesce (display_name, discord_name) ASC LIMIT 100`
    : `SELECT id, discord_id, discord_name, display_name, avatar, is_admin, is_banned, ban_reason, created_at, last_login_at
       FROM users ORDER BY coalesce (display_name, discord_name) ASC LIMIT 100`;
  const stmt = c.env.DB.prepare(sql);
  const rows = q ? await stmt.bind(`%${q}%`, `%${q}%`).all() : await stmt.all();
  return c.json({ users: rows.results ?? [] });
});

admin.get('/users/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0)
    httpError(400, "Invalid user id");

  const row = await c.env.DB.prepare(`SELECT * FROM users WHERE id = ? LIMIT 1`).bind(id).first();
  if (!row) 
    httpError(404, 'User not found');
  
  return c.json({ user: row });
});

admin.patch("/users/:id/admin", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) httpError(400, "invalid user id");

  const body = await c.req.json<{ is_admin?: boolean }>();

  if (typeof body.is_admin !== "boolean") {
    httpError(400, "is_admin must be a boolean");
  }

  const currentUser = c.get("user");
  const currentUserId = currentUser?.id ?? null;

  if (id === currentUserId && !body.is_admin) {
    httpError(400, "you cannot remove your own admin privileges");
  }

  const result = await c.env.DB.prepare(
    `UPDATE users
     SET is_admin = ?
     WHERE id = ?`
  )
    .bind(body.is_admin ? 1 : 0, id)
    .run();

  if ((result.meta.changes ?? 0) < 1) {
    httpError(404, "User not found");
  }

  return c.json({ ok: true });
});

admin.patch("/users/:id/ban", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) httpError(400, "invalid user id");

  const body = await c.req.json<{
    is_banned?: boolean;
    ban_reason?: string | null;
  }>();

  if (typeof body.is_banned !== "boolean") {
    httpError(400, "is_banned must be a boolean");
  }

  const normalizedReason =
    body.is_banned
      ? (body.ban_reason?.trim() || null)
      : null;

  const result = await c.env.DB.prepare(
    `UPDATE users
     SET is_banned = ?,
         ban_reason = ?
     WHERE id = ?`
  )
    .bind(body.is_banned ? 1 : 0, normalizedReason, id)
    .run();

  if ((result.meta.changes ?? 0) < 1) {
    httpError(404, "User not found");
  }

  return c.json({ ok: true });
});

admin.post('/tournaments', async (c) => {
  const body = await c.req.json<{ slug?: string; name?: string; description?: string | null; default_ruleset?: number | null; starts_at?: string | null; ends_at?: string | null }>();

  const slug = body.slug?.trim();
  const name = body.name?.trim();
  if (!slug || !name) 
    httpError(400, 'slug and name are required');

  const existing = await c.env.DB.prepare(`SELECT id FROM tournaments WHERE slug = ? LIMIT 1`).bind(slug).first<{ id: number }>();
  if (existing)
    httpError(404, "Tournament slug already exists");
  
  const result = await c.env.DB.prepare(
    `INSERT INTO tournaments (slug, name, description, status, default_ruleset, starts_at, ends_at)
     VALUES (?, ?, ?, 'draft', ?, ?, ?)`
  ).bind(slug, name, body.description ?? null, body.default_ruleset ?? null, body.starts_at ?? null, body.ends_at ?? null).run();
  
  return c.json({ ok: true, id: result.meta.last_row_id }, 201);
});

admin.delete('/tournaments/:slug', async (c) => {
  const slug = c.req.param('slug');

  const result = await c.env.DB.prepare(`DELETE FROM tournaments WHERE slug = ?`).bind(slug).run();
  if ((result.meta.changes ?? 0) === 0)
    httpError(404, "Tournament not found");
  
  return c.json({ ok: true });
});

export default admin;
