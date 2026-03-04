import { Hono } from "hono";
import type { Env } from "../app";
import { requireGlobalAdmin } from "../lib/perm_mw";
import { requireUser } from "../lib/auth_session";
import { badRequest, ok } from "../lib/http";

const admin = new Hono<{ Bindings: Env }>();

admin.use("*", requireUser);
admin.use("*", requireGlobalAdmin);


// POST /api/admin/tournaments  { slug, name, description?, starts_at?, ends_at? }
admin.post("/tournaments", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return badRequest(c, "Invalid JSON");
  if (!body.slug || !body.name) return badRequest(c, "slug and name required");

  const slug = String(body.slug).trim();
  const name = String(body.name).trim();
  const description = body.description != null ? String(body.description) : null;
  const startsAt = body.starts_at != null ? String(body.starts_at) : null;
  const endsAt = body.ends_at != null ? String(body.ends_at) : null;

  const res = await c.env.DB.prepare(
    `INSERT INTO tournaments (slug, name, description, status, starts_at, ends_at)
     VALUES (?, ?, ?, 'draft', ?, ?)`
  )
    .bind(slug, name, description, startsAt, endsAt)
    .run();

  return ok(c, { ok: true, id: res.meta.last_row_id });
});

export default admin;