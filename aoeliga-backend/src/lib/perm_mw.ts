import type { MiddlewareHandler } from "hono";
import type { Env, UserRow } from "./auth_session";

export const requireGlobalAdmin: MiddlewareHandler<{ Bindings: Env; Variables: { user: UserRow } }> = 
  async (c, next) => {
    const user = c.get("user");
    if (!user || user.is_admin !== 1) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  };