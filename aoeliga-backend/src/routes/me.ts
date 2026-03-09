import { Hono } from 'hono';
import type { AppBindings } from '../types';
import { optionalUser } from '../lib/auth_session';

const me = new Hono<AppBindings>();

me.use('*', optionalUser);

me.get('/', (c) => {
  return c.json({ user: c.get('user') ?? null });
});

export default me;
