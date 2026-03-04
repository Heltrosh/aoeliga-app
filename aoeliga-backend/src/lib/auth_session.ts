import type { Context, MiddlewareHandler } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

export type Env = {
  DB: D1Database;
  APP_ORIGIN: string;

  // oauth bits (you already have these)
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_REDIRECT_URI: string;
};

export type UserRow = {
  id: number;
  discord_id: string;
  username: string | null;
  global_name: string | null;
  avatar: string | null;
  is_admin: number; // 0/1
};

export const SESSION_COOKIE = "aoeliga_session";

async function loadUserFromSession(c: Context<any>, sessionId: string): Promise<UserRow | null> {
  const row = await c.env.DB.prepare(
    `SELECT u.id, u.discord_id, u.username, u.global_name, u.avatar, u.is_admin
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ?
       AND s.revoked_at IS NULL
       AND s.expires_at > datetime('now')`
  ).bind(sessionId).first();

  return row ?? null;
}

// Sets c.set("user", user) if logged in; otherwise leaves it undefined
export const optionalUser: MiddlewareHandler<{ Bindings: Env; Variables: { user?: UserRow } }> =
  async (c, next) => {
    const sid = getCookie(c, SESSION_COOKIE);
    if (sid) {
      const user = await loadUserFromSession(c, sid);
      if (user) c.set("user", user);
    }
    await next();
  };

export const requireUser: MiddlewareHandler<{ Bindings: Env; Variables: { user: UserRow } }> =
  async (c, next) => {
    const sid = getCookie(c, SESSION_COOKIE);
    if (!sid) return c.json({ error: "Unauthorized" }, 401);

    const user = await loadUserFromSession(c, sid);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    c.set("user", user);
    await next();
  };

// Keep your existing cookie helper if you already have one.
// This version is safe for localhost dev.
export function setSessionCookie(c: Context, sessionId: string, maxAgeSeconds: number) {
  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: false,        // set true in production (https)
    sameSite: "Lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}