import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";

export function ok<T>(c: Context, data: T, status: 200 | 201 = 200) {
  return c.json(data, status);
}

export function noContent(c: Context) {
  return c.body(null, 204);
}

export function httpError(status: 400 | 401 | 403 | 404 | 409 | 422 | 500 | 501, message: string): never {
  if (status === 400)
    message = "Bad Request: " + message; 
  throw new HTTPException(status, { message });
}