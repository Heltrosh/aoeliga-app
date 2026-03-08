import { Hono } from "hono";
import { cors } from "hono/cors";

import publicRoutes from "./routes/public";
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";

export type Env = {
  DB: D1Database;
  ADMIN_TOKEN?: string;
  CORS_ORIGIN?: string;

  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_REDIRECT_URI: string;
  APP_ORIGIN: string;

};

const app = new Hono<{ Bindings: Env }>();

// --- CORS ---
// For local dev with Vite: allow localhost:5173.
// For production: set CORS_ORIGIN to your Pages domain and only allow that.
app.use(
  "/api/*",
  cors({
    origin: (origin, c) => {
      const configured = (c.env.CORS_ORIGIN ?? "").trim();
      if (!configured) return "*";
      // If configured, allow only that origin. (Or return null to block.)
      if (origin === configured) return origin;
      return configured;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Admin-Token"],
    credentials: true,
    maxAge: 86400,
  })
);

// Mount routes
app.route("/api", publicRoutes);
app.route("/api/admin", adminRoutes);
app.route("/auth", authRoutes);

// 404 fallback
app.notFound((c) => c.json({ error: "Not found", path: c.req.path }, 404));

// Basic error handler (prevents stack traces leaking)
app.onError((err, c) => {
  return c.json({ error: err?.message ?? String(err) }, 500);
});

export default app;