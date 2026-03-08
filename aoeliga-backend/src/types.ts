export type Env = {
  DB: D1Database;

  CORS_ORIGIN?: string;

  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_REDIRECT_URI: string;
  APP_ORIGIN: string;
};

export type AppBindings = {
  Bindings: Env;
  Variables: {
    user: AuthUser | null;
    tournament: TournamentRow | null;
    tournamentRole: TournamentRole | null;
    isTournamentStreamer: boolean;
    isTournamentPlayer: boolean;
  };
};

export type AuthUser = {
  id: number;
  discord_id: string;
  discord_name: string;
  display_name: string | null;
  avatar: string | null;
  is_admin: number;
};

export type TournamentRole = "admin" | "moderator";

export type TournamentRow = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};