import { api } from "./client";
import {
  tournamentAdminsResponseSchema,
  listTournamentsResponseSchema,
  createTournamentInputSchema,
  updateTournamentInputSchema,
  tournamentContextResponseSchema,
  tournamentPlayersResponseSchema,
  tournamentStreamersResponseSchema,
  tournamentRegistrationSelfResponseSchema,
  createTournamentRegistrationInputSchema,
  staffTournamentRegistrationsResponseSchema,
  reviewTournamentRegistrationInputSchema,
  createStaffTournamentRegistrationInputSchema,
  registrationSettingsInputSchema,
  registrationSettingsResponseSchema,
  type TournamentAdminRow,
  type ListTournamentsResponse,
  type CreateTournamentInput,
  type UpdateTournamentInput,
  type TournamentContextResponse,
  type TournamentPlayerRow,
  type TournamentStreamerRow,
  type TournamentRegistrationSelfResponse,
  type CreateTournamentRegistrationInput,
  type StaffTournamentRegistrationsResponse,
  type ReviewTournamentRegistrationInput,
  type CreateStaffTournamentRegistrationInput,
  type RegistrationSettingsInput,
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

export async function getMyTournamentRegistration(
  slug: string,
): Promise<TournamentRegistrationSelfResponse> {
  const json = await api.get(`/api/tournaments/${slug}/registration/me`);
  return tournamentRegistrationSelfResponseSchema.parse(json);
}

export async function createMyTournamentRegistration(
  slug: string,
  input: CreateTournamentRegistrationInput,
): Promise<TournamentRegistrationSelfResponse> {
  const payload = createTournamentRegistrationInputSchema.parse(input);
  const json = await api.post(`/api/tournaments/${slug}/registration/me`, payload);
  return tournamentRegistrationSelfResponseSchema.parse(json);
}

export async function updateMyTournamentRegistration(
  slug: string,
  input: CreateTournamentRegistrationInput,
): Promise<TournamentRegistrationSelfResponse> {
  const payload = createTournamentRegistrationInputSchema.parse(input);
  const json = await api.put(`/api/tournaments/${slug}/registration/me`, payload);
  return tournamentRegistrationSelfResponseSchema.parse(json);
}

export async function withdrawMyTournamentRegistration(
  slug: string,
): Promise<TournamentRegistrationSelfResponse> {
  const json = await api.post(`/api/tournaments/${slug}/registration/me/withdraw`, {});
  return tournamentRegistrationSelfResponseSchema.parse(json);
}

export async function getTournamentRegistrations(
  slug: string,
): Promise<StaffTournamentRegistrationsResponse> {
  const json = await api.get(`/api/tournaments/${slug}/registrations`);
  return staffTournamentRegistrationsResponseSchema.parse(json);
}

export async function reviewTournamentRegistration(
  slug: string,
  userId: number,
  input: ReviewTournamentRegistrationInput,
) {
  const payload = reviewTournamentRegistrationInputSchema.parse(input);
  return api.post(`/api/tournaments/${slug}/registrations/${userId}/review`, payload);
}

export async function refreshTournamentRegistration(
  slug: string,
  userId: number,
) {
  return api.post(`/api/tournaments/${slug}/registrations/${userId}/refresh`, {});
}

export async function refreshAllTournamentRegistrations(
  slug: string,
): Promise<StaffTournamentRegistrationsResponse> {
  const json = await api.post(`/api/tournaments/${slug}/registrations/refresh`, {});
  return staffTournamentRegistrationsResponseSchema.parse(json);
}

export async function createTournamentRegistrationForUser(
  slug: string,
  input: CreateStaffTournamentRegistrationInput,
) {
  const payload = createStaffTournamentRegistrationInputSchema.parse(input);
  return api.post(`/api/tournaments/${slug}/registrations`, payload);
}

export async function updateTournamentRegistrationSettings(
  slug: string,
  input: RegistrationSettingsInput,
) {
  const payload = registrationSettingsInputSchema.parse(input);
  const json = await api.put(`/api/tournaments/${slug}/registration-settings`, payload);
  return registrationSettingsResponseSchema.parse(json);
}