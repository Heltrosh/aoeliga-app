import type { Context, MiddlewareHandler } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { AuthUser } from '../domain/auth';
import type { AppBindings } from '../types/app';
import { httpError } from "./http";

export const SESSION_COOKIE = "aoeliga_session";

export function getSessionId(c: Context<AppBindings>): string | null {
  return getCookie(c, SESSION_COOKIE) ?? null;
}

async function loadUserFromSession(c: Context<AppBindings>): Promise<AuthUser | null> {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (!sessionId) return null;

  const row = await c.env.DB.prepare(
    `SELECT u.*
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ?
       AND s.revoked_at IS NULL
       AND s.expires_at > datetime('now')
    LIMIT 1`
  ).bind(sessionId).first<AuthUser>();

  return row ?? null;
}

export const optionalUser: MiddlewareHandler<AppBindings> =
  async (c, next) => {
    const user = await loadUserFromSession(c);
    c.set("user", user);
    await next();
  };

export const requireUser: MiddlewareHandler<AppBindings> =
  async (c, next) => {
    const existingUser = c.get("user");
    const user = existingUser ?? (await loadUserFromSession(c));

    if (!user) {
      httpError(401, "Unauthorized");
    }

    c.set("user", user);
    await next();
  };

export function getUser(c: Context<AppBindings>): AuthUser | null {
  return c.get("user") ?? null;
}

export function setSessionCookie(c: Context<AppBindings>, sessionId: string, maxAgeSeconds: number) {
  const isHttps = new URL(c.req.url).protocol === "https:";

  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: isHttps, 
    sameSite: "Lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export function clearSessionCookie(c: Context<AppBindings>) {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}
