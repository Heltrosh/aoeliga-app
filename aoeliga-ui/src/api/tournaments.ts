import { api } from "./client";
import {
  tournamentAdminsResponseSchema,
  listTournamentsResponseSchema,
  createTournamentInputSchema,
  updateTournamentInputSchema,
  tournamentContextResponseSchema,
  tournamentPlayersResponseSchema,
  tournamentStreamersResponseSchema,
  type TournamentAdminRow,
  type ListTournamentsResponse,
  type CreateTournamentInput,
  type UpdateTournamentInput,
  type TournamentContextResponse,
  type TournamentPlayerRow,
  type TournamentStreamerRow,
} from "./schemas/tournaments";

export async function listTournaments(): Promise<ListTournamentsResponse> {
  const json = await api.get("/api/tournaments");
  return listTournamentsResponseSchema.parse(json);
}

export async function getTournamentBySlug(slug: string): Promise<TournamentContextResponse> {
  const json = await api.get(`/api/tournaments/${slug}`);
  return tournamentContextResponseSchema.parse(json);
}

export async function createTournament(input: CreateTournamentInput) {
  const payload = createTournamentInputSchema.parse(input);
  return api.post("/api/admin/tournaments", payload);
}

export async function updateTournament(
  slug: string,
  input: UpdateTournamentInput,
) {
  const payload = updateTournamentInputSchema.parse(input);
  return api.put(`/api/tournaments/${slug}`, payload);
}

export async function deleteTournament(slug: string) {
  return api.delete(`/api/admin/tournaments/${slug}`);
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
  return api.delete(`/api/tournaments/${slug}/admins/${userId}`);
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
  return api.delete(`/api/tournaments/${slug}/streamers/${userId}`);
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
  return api.delete(`/api/tournaments/${slug}/players/${playerId}`);
}
