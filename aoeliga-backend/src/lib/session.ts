import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context } from "hono";

const COOKIE_NAME = "aoeliga_session";

export function getSessionId(c: Context): string | null {
  return getCookie(c, COOKIE_NAME) ?? null;
}

export function setSessionCookie(c: Context, sessionId: string, maxAgeSeconds: number) {
  const isHttps = new URL(c.req.url).protocol === "https:";

  setCookie(c, COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: isHttps,      // secure only on https
    sameSite: "Lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, COOKIE_NAME, { path: "/" });
}