export type AuthUser = {
  id: number;
  discord_id: string;
  discord_name: string | null;
  display_name: string | null;
  avatar: string | null;
  is_admin: number;
  is_banned: number;
};

export type MeResponse = {
  user: AuthUser | null;
};