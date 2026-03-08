import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";


import type { AppBindings } from './types';

import admin from './routes/admin';
import me from './routes/me';
import rulesets from './routes/rulesets';
//import tournaments from './routes/tournaments';
//import users from './routes/users';
import auth from "./routes/auth";

const app = new Hono<AppBindings>();

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

app.route('/api/me', me);
//app.route('/api/users', users);
app.route('/api/rulesets', rulesets);
//app.route('/api/tournaments', tournaments);
app.route('/api/admin', admin);
app.route('/app/auth/', auth);

// 404 fallback
app.notFound((c) => c.json({ error: "Not found", path: c.req.path }, 404));

// Basic error handler (prevents stack traces leaking)
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
