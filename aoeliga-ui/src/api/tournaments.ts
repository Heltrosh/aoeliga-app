import { api } from "./client";
import {
  tournamentAdminsResponseSchema,
  tournamentDetailResponseSchema,
  tournamentPlayersResponseSchema,
  tournamentStreamersResponseSchema,
  type TournamentAdminRow,
  type TournamentDetailResponse,
  type TournamentPlayerRow,
  type TournamentStreamerRow,
} from "./schemas/tournaments";

export function listTournaments() {
  return api.get("/api/tournaments");
}

export async function getTournament(slug: string): Promise<TournamentDetailResponse> {
  const json = await api.get(`/api/tournaments/${slug}`);
  return tournamentDetailResponseSchema.parse(json);
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

export type { TournamentAdminRow, TournamentStreamerRow, TournamentPlayerRow };

export async function getTournamentAdmins(slug: string): Promise<{ admins: TournamentAdminRow[] }> {
  const json = await api.get(`/api/tournaments/${slug}/admins`);
  return tournamentAdminsResponseSchema.parse(json);
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

export async function getTournamentStreamers(
  slug: string
): Promise<{ streamers: TournamentStreamerRow[] }> {
  const json = await api.get(`/api/tournaments/${slug}/streamers`);
  return tournamentStreamersResponseSchema.parse(json);
}

export function addTournamentStreamer(slug: string, body: { user_id: number }) {
  return api.post(`/api/tournaments/${slug}/streamers`, body);
}

export function removeTournamentStreamer(slug: string, userId: number) {
  return api.del(`/api/tournaments/${slug}/streamers/${userId}`);
}

export async function getTournamentPlayers(
  slug: string
): Promise<{ players: TournamentPlayerRow[] }> {
  const json = await api.get(`/api/tournaments/${slug}/players`);
  return tournamentPlayersResponseSchema.parse(json);
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
