import { Hono } from 'hono';
import type { AppBindings } from '../types/app';
import { requireUser } from '../lib/auth_session';
import { httpError } from '../lib/http';
import { requirePermission } from '../lib/permissions';
import {
  createRulesetDto,
  deleteRulesetDto,
  getRulesetCatalogDto,
  getRulesetDto,
  listRulesetDtos,
  updateRulesetDto,
  validateRulesetDto,
} from '../services/rulesets';

const rulesets = new Hono<AppBindings>();

rulesets.use('*', requireUser);

rulesets.get('/catalog', async (c) => {
  return c.json({ catalog: getRulesetCatalogDto() });
});

rulesets.post('/validate', async (c) => {
  const body = await c.req.json<{ config?: unknown }>();
  return c.json(await validateRulesetDto(body.config));
});

rulesets.get('/', async (c) => {
  return c.json({ rulesets: await listRulesetDtos(c.env) });
});

rulesets.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0) httpError(400, 'Invalid ruleset id');
  return c.json({ ruleset: await getRulesetDto(c.env, id) });
});

rulesets.post('/', requirePermission('ruleset.create'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ name?: string; config?: unknown }>();
  const name = body.name?.trim();
  if (!name) httpError(400, 'name is required');

  const ruleset = await createRulesetDto(c.env, {
    name,
    config: body.config,
    createdByUserId: user!.id,
  });

  return c.json({ ok: true, ruleset }, 201);
});

rulesets.put(
  '/:id',
  requirePermission('ruleset.update.own', async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) httpError(400, 'Invalid ruleset id');
    const existing = await getRulesetDto(c.env, id);
    return { ownerUserId: existing.created_by_user_id };
  }),
  async (c) => {
    const id = Number(c.req.param('id'));
    const body = await c.req.json<{ name?: string; config?: unknown }>();
    const name = body.name?.trim();
    if (!name) httpError(400, 'name is required');

    const ruleset = await updateRulesetDto(c.env, {
      id,
      name,
      config: body.config,
    });

    return c.json({ ok: true, ruleset });
  }
);

rulesets.delete(
  '/:id',
  requirePermission('ruleset.update.own', async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) httpError(400, 'Invalid ruleset id');
    const existing = await getRulesetDto(c.env, id);
    return { ownerUserId: existing.created_by_user_id };
  }),
  async (c) => {
    const id = Number(c.req.param('id'));
    const result = await deleteRulesetDto(c.env, id);
    if ((result.meta.changes ?? 0) === 0) httpError(404, 'Ruleset not found');
    return c.json({ ok: true });
  }
);

export default rulesets;
