export type Env = {
  DB: D1Database;
  REPLAYS_BUCKET: R2Bucket;

  CORS_ORIGIN?: string;

  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_REDIRECT_URI: string;
  APP_ORIGIN: string;

  PARSER_URL: string;
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
  R2_ACCOUNT_ID: string;
  R2_BUCKET_NAME: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
};

export type Db = Env["DB"];