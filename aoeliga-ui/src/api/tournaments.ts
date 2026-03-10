import { api } from "./client";
import type { TournamentDetailResponse } from "../tournament/tournament-types";

export function listTournaments() {
  return api.get("/api/tournaments");
}

export function getTournament(slug: string): Promise<TournamentDetailResponse> {
  return api.get(`/api/tournaments/${slug}`);
}

export function createTournament(body: {
  slug: string;
  name: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
}) {
  return api.post("/api/admin/tournaments", body);
}

export type TournamentAdminRow = {
  user_id: number;
  role: "admin" | "moderator";
  discord_name: string | null;
  display_name: string | null;
  avatar: string | null;
};

export type TournamentStreamerRow = {
  user_id: number;
  discord_name: string | null;
  display_name: string | null;
  avatar: string | null;
};

export type TournamentPlayerRow = {
  id: number;
  user_id: number;
  aoe_id: string;
  status: string;
  discord_name: string | null;
  display_name: string | null;
  avatar: string | null;
};

export function getTournamentAdmins(slug: string): Promise<{ admins: TournamentAdminRow[] }> {
  return api.get(`/api/tournaments/${slug}/admins`);
}

export function addTournamentAdmin(
  slug: string,
  body: { user_id: number; role: "admin" | "moderator" }
) {
  return api.post(`/api/tournaments/${slug}/admins`, body);
}

export function removeTournamentAdmin(slug: string, userId: number) {
  return api.del(`/api/tournaments/${slug}/admins/${userId}`);
}

export function getTournamentStreamers(
  slug: string
): Promise<{ streamers: TournamentStreamerRow[] }> {
  return api.get(`/api/tournaments/${slug}/streamers`);
}

export function addTournamentStreamer(slug: string, body: { user_id: number }) {
  return api.post(`/api/tournaments/${slug}/streamers`, body);
}

export function removeTournamentStreamer(slug: string, userId: number) {
  return api.del(`/api/tournaments/${slug}/streamers/${userId}`);
}

export function getTournamentPlayers(
  slug: string
): Promise<{ players: TournamentPlayerRow[] }> {
  return api.get(`/api/tournaments/${slug}/players`);
}

export function addTournamentPlayer(
  slug: string,
  body: { user_id: number; aoe_id: string; status?: string }
) {
  return api.post(`/api/tournaments/${slug}/players`, body);
}

export function removeTournamentPlayer(slug: string, playerId: number) {
  return api.del(`/api/tournaments/${slug}/players/${playerId}`);
}