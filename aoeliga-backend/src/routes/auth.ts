//TODO styling

import { Hono } from "hono";
import type { AppBindings } from "../types";
import { ok, httpError } from "../lib/http";
import { setSessionCookie, clearSessionCookie, getSessionId } from "../lib/auth_session";

const auth = new Hono<AppBindings>();

function randomState(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

// POST /auth/logout
auth.post("/logout", async (c) => {
  const sid = getSessionId(c);
  if (sid) {
    await c.env.DB.prepare(`UPDATE sessions SET revoked_at = datetime('now') WHERE id = ?`).bind(sid).run();
  }
  clearSessionCookie(c);
  return ok(c, { ok: true });
});

// GET /auth/discord  (start)
auth.get("/discord", async (c) => {
  const state = randomState();
  const redirectTo = c.req.query("redirect") || "/";

  // store state in DB (10 min expiry)
  await c.env.DB.prepare(
    `INSERT INTO oauth_states (state, expires_at, redirect_to)
     VALUES (?, datetime('now', '+10 minutes'), ?)`
  ).bind(state, redirectTo).run();

  const params = new URLSearchParams({
    client_id: c.env.DISCORD_CLIENT_ID,
    redirect_uri: c.env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "none",
  });

  // Discord authorize URL
  return c.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

// GET /auth/discord/callback  (finish)
auth.get("/discord/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  if (!code || !state) return httpError(400, "Missing code/state");

  // verify state (and delete it)
  const stateRow = await c.env.DB.prepare(
    `SELECT state, redirect_to
     FROM oauth_states
     WHERE state = ?
       AND expires_at > datetime('now')`
  ).bind(state).first();

  if (!stateRow) return httpError(400, "Invalid or expired state");

  await c.env.DB.prepare(`DELETE FROM oauth_states WHERE state = ?`).bind(state).run();

  // exchange code -> access token
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: c.env.DISCORD_CLIENT_ID,
      client_secret: c.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: c.env.DISCORD_REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text().catch(() => "");
    return c.json({ error: "Token exchange failed", details: txt }, 400);
  }

  const tokenJson: any = await tokenRes.json();
  const accessToken = tokenJson.access_token as string;

  // fetch user
  const meRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!meRes.ok) {
    const txt = await meRes.text().catch(() => "");
    return c.json({ error: "Failed to fetch user", details: txt }, 400);
  }

  const me: any = await meRes.json();
  // me.id, me.discord_name, me.display_name, me.avatar
  // /users/@me is the standard identity endpoint. :contentReference[oaicite:5]{index=5}

  // upsert user
  await c.env.DB.prepare(
    `INSERT INTO users (discord_id, discord_name, display_name, avatar, last_login_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(discord_id) DO UPDATE SET
       discord_name = excluded.discord_name,
       display_name = excluded.display_name,
       avatar = excluded.avatar,
       last_login_at = datetime('now')`
  ).bind(me.id, me.username ?? null, me.global_name ?? null, me.avatar ?? null).run();

  const userRow: any = await c.env.DB.prepare(
    `SELECT id FROM users WHERE discord_id = ?`
  ).bind(me.id).first();

  // create session (30 days)
  const sessionId = crypto.randomUUID().replace(/-/g, "");
  const maxAgeSeconds = 60 * 60 * 24 * 30;

  await c.env.DB.prepare(
    `INSERT INTO sessions (id, user_id, expires_at, user_agent, ip)
     VALUES (?, ?, datetime('now', '+30 days'), ?, ?)`
  ).bind(
    sessionId,
    userRow.id,
    c.req.header("User-Agent") ?? null,
    c.req.header("CF-Connecting-IP") ?? null
  ).run();

  setSessionCookie(c, sessionId, maxAgeSeconds);

  // redirect back to UI
  const redirectTo = (stateRow as any).redirect_to || "/";
  return c.redirect(`${c.env.APP_ORIGIN}${redirectTo}`);
});

export default auth;