import { Hono } from 'hono';
import type { AppBindings } from '../types';
import { requireUser } from '../lib/auth_session';
import { httpError } from '../lib/http';
import { requirePermission } from '../lib/permissions';
import { config } from 'node:process';

const rulesets = new Hono<AppBindings>();

rulesets.use('*', requireUser);

rulesets.get('/', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT r.id, r.name, r.config_json, r.created_at, r.created_by_user_id,
            u.display_name, u.discord_name
     FROM rulesets r
     JOIN users u ON u.id = r.created_by_user_id
     ORDER BY r.id DESC`
  ).all();
  
  return c.json({ rulesets: rows.results ?? [] });
});

rulesets.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));  
  if (!Number.isInteger(id) || id <= 0)
    httpError(400, "Invalid ruleset id");
  
  const row = await c.env.DB.prepare(
    `SELECT r.id, r.name, r.config_json, r.created_at, r.created_by_user_id,
            u.display_name, u.discord_name
    FROM rulesets r
    JOIN users u ON u.id = r.created_by_user_id
    WHERE r.id = ? 
    LIMIT 1`
  ).bind(id).first();
  
  if (!row) 
    httpError(404, 'Ruleset not found');
  
  return c.json({ ruleset: row });
});

rulesets.post('/', requirePermission("ruleset.create"), async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ name?: string; config_json?: string }>();
  const name = body.name?.trim();
  const configJson = body.config_json?.trim();
  if (!name || !configJson)
    httpError(400, "name and config_json are required");

  const result = await c.env.DB.prepare(
    `INSERT INTO rulesets (name, config_json, created_by_user_id) VALUES (?, ?, ?)`
  ).bind(name, configJson, user!.id).run();
  
  return c.json({ ok: true, id: result.meta.last_row_id }, 201);
});

rulesets.put('/:id', requirePermission('ruleset.update.own', async (c) => {
    const id = Number(c.req.param('id'));  
    if (!Number.isInteger(id) || id <= 0)
        httpError(400, "Invalid ruleset id");
    
    const existing = await c.env.DB.prepare(`SELECT created_by_user_id FROM rulesets WHERE id = ? LIMIT 1`).bind(id).first<{ created_by_user_id: number }>();
    if (!existing) 
      httpError(404, 'Ruleset not found');
    
    return { ownerUserId: existing.created_by_user_id };
  }),
  async (c) => {
    const id = Number(c.req.param('id'));
    const body = await c.req.json<{ name?: string; config_json?: string }>();
    const name = body.name?.trim();
    const configJson = body.config_json?.trim();
    if (!name || !configJson)
      httpError(400, "name and config_json are required");

    await c.env.DB.prepare(`UPDATE rulesets SET name = ?, config_json = ? WHERE id = ?`).bind(name, configJson, id).run();
    
    return c.json({ ok: true });
  }
);

rulesets.delete('/:id', requirePermission('ruleset.update.own', async (c) => {
    const id = Number(c.req.param('id'));  
    if (!Number.isInteger(id) || id <= 0)
      httpError(400, "Invalid ruleset id");
    
    const existing = await c.env.DB.prepare(`SELECT created_by_user_id FROM rulesets WHERE id = ? LIMIT 1`).bind(id).first<{ created_by_user_id: number }>();
    if (!existing) 
      httpError(404, 'Ruleset not found');
    
    return { ownerUserId: existing.created_by_user_id };
  }), 
  async (c) => {
    const id = Number(c.req.param('id'));
    
    await c.env.DB.prepare(`DELETE FROM rulesets WHERE id = ?`).bind(id).run();
    
    return c.json({ ok: true });
});

export default rulesets;
