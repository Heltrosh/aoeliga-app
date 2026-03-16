import { Hono } from 'hono';
import type { AppBindings } from '../types/app';
import { requireUser } from '../lib/auth_session';
import { httpError } from '../lib/http';
import { isGlobalAdmin, requirePermission } from '../lib/permissions';
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
  const user = c.get('user');
  return c.json({
    rulesets: await listRulesetDtos(c.env, {
      requesterUserId: user?.id ?? null,
      isGlobalAdmin: isGlobalAdmin(user),
    }),
  });
});

rulesets.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0) httpError(400, 'Invalid ruleset id');

  const user = c.get('user');

  return c.json({
    ruleset: await getRulesetDto(c.env, id, {
      requesterUserId: user?.id ?? null,
      isGlobalAdmin: isGlobalAdmin(user),
    }),
  });
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
  },
  {
    requesterUserId: user?.id ?? null,
    isGlobalAdmin: isGlobalAdmin(user),
  }
);

  return c.json({ ok: true, ruleset }, 201);
});

rulesets.put(
  '/:id',
  requirePermission('ruleset.update.own', async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) httpError(400, 'Invalid ruleset id');

    const user = c.get('user');
    const existing = await getRulesetDto(c.env, id, {
      requesterUserId: user?.id ?? null,
      isGlobalAdmin: isGlobalAdmin(user),
    });

    return { ownerUserId: existing.created_by_user_id ?? undefined };
  }),
  async (c) => {
    const id = Number(c.req.param('id'));
    const user = c.get('user');
    const body = await c.req.json<{ name?: string; config?: unknown }>();
    const name = body.name?.trim();
    if (!name) httpError(400, 'name is required');

    const ruleset = await updateRulesetDto(
      c.env,
      {
        id,
        name,
        config: body.config,
      },
      {
        requesterUserId: user?.id ?? null,
        isGlobalAdmin: isGlobalAdmin(user),
      }
    );

    return c.json({ ok: true, ruleset });
  }
);

rulesets.delete(
  '/:id',
  requirePermission('ruleset.update.own', async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) httpError(400, 'Invalid ruleset id');

    const user = c.get('user');
    const existing = await getRulesetDto(c.env, id, {
      requesterUserId: user?.id ?? null,
      isGlobalAdmin: isGlobalAdmin(user),
    });

    return { ownerUserId: existing.created_by_user_id ?? undefined };
  }),
  async (c) => {
    const id = Number(c.req.param('id'));
    await deleteRulesetDto(c.env, id);
    return c.json({ ok: true });
  }
);

export default rulesets;
