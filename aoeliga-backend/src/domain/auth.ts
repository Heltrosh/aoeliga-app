export type AuthUser = {
  id: number;
  discord_id: string;
  discord_name: string;
  display_name: string | null;
  avatar: string | null;
  is_admin: number;
};