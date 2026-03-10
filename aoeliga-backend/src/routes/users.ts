import { Hono } from 'hono';
import type { AppBindings } from '../types';
import { requireUser } from '../lib/auth_session';
import { requirePermission } from '../lib/permissions';

const users = new Hono<AppBindings>();

users.use('*', requireUser);

users.get('/', requirePermission('user.lightweight'), async(c) => {
  const rows = await c.env.DB.prepare(
    `SELECT id, discord_id, discord_name, display_name, avatar
     FROM users
     ORDER BY coalesce (display_name, discord_name) ASC`
  ).all();
  
  return c.json({ users: rows.results ?? [] });
  
});

users.get('/search', requirePermission('user.search'), async (c) => {
  const q = (c.req.query('q') ?? '').trim();
  if (!q) 
    return c.json({ users: [] });

  const rows = await c.env.DB.prepare(
    `SELECT id, discord_id, discord_name, display_name, avatar
     FROM users
     WHERE is_banned = 0
       AND (
         lower(coalesce(discord_name, '')) LIKE lower(?) OR
         lower(coalesce(display_name, '')) LIKE lower(?) OR
         discord_id LIKE ?
       )
     ORDER BY coalesce(display_name, discord_name, discord_id) ASC
     LIMIT 20`
  ).bind(`%${q}%`, `%${q}%`, `%${q}%`).all();

  return c.json({ users: rows.results ?? [] });
});

export default users;
