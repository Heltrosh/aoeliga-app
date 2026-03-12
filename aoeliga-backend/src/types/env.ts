export type Env = {
  DB: D1Database;

  CORS_ORIGIN?: string;

  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_REDIRECT_URI: string;
  APP_ORIGIN: string;
};