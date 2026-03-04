import type { Context } from "hono";

export function ok<T>(c: Context, data: T, status = 200) {
  return c.json(data as any, { status: status as any });
}

export function badRequest(c: Context, message = "Bad request") {
  return c.json({ error: message }, { status: 400 as any });
}

export function unauthorized(c: Context, message = "Unauthorized") {
  return c.json({ error: message }, { status: 401 as any });
}

export function forbidden(c: Context, message = "Forbidden") {
  return c.json({ error: message }, { status: 403 as any });
}

export function notFound(c: Context, message = "Not found") {
  return c.json({ error: message }, { status: 404 as any });
}