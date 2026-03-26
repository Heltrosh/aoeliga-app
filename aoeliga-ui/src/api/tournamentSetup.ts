import { api } from "./client";
import {
  applyTournamentSetupResponseSchema,
  generateSetupAssignmentsInputSchema,
  replaceSetupAssignmentsInputSchema,
  replaceSetupMatchesInputSchema,
  tournamentSetupResponseSchema,
  updateSetupDivisionsInputSchema,
  type GenerateSetupAssignmentsInput,
  type ReplaceSetupAssignmentsInput,
  type ReplaceSetupMatchesInput,
  type TournamentSetup,
  type UpdateSetupDivisionsInput,
} from "./schemas/tournamentSetup";

export async function getTournamentSetup(slug: string): Promise<TournamentSetup> {
  const json = await api.get(`/api/tournaments/${slug}/setup`);
  return tournamentSetupResponseSchema.parse(json).setup;
}

export async function updateTournamentSetupDivisions(
  slug: string,
  input: UpdateSetupDivisionsInput,
): Promise<TournamentSetup> {
  const payload = updateSetupDivisionsInputSchema.parse(input);
  const json = await api.put(`/api/tournaments/${slug}/setup/divisions`, payload);
  return tournamentSetupResponseSchema.parse(json).setup;
}

export async function generateTournamentSetupAssignments(
  slug: string,
  input: GenerateSetupAssignmentsInput,
): Promise<TournamentSetup> {
  const payload = generateSetupAssignmentsInputSchema.parse(input);
  const json = await api.post(`/api/tournaments/${slug}/setup/assignments/generate`, payload);
  return tournamentSetupResponseSchema.parse(json).setup;
}

export async function replaceTournamentSetupAssignments(
  slug: string,
  input: ReplaceSetupAssignmentsInput,
): Promise<TournamentSetup> {
  const payload = replaceSetupAssignmentsInputSchema.parse(input);
  const json = await api.put(`/api/tournaments/${slug}/setup/assignments`, payload);
  return tournamentSetupResponseSchema.parse(json).setup;
}

export async function generateTournamentSetupMatches(
  slug: string,
): Promise<TournamentSetup> {
  const json = await api.post(`/api/tournaments/${slug}/setup/matches/generate`, {});
  return tournamentSetupResponseSchema.parse(json).setup;
}

export async function replaceTournamentSetupMatches(
  slug: string,
  input: ReplaceSetupMatchesInput,
): Promise<TournamentSetup> {
  const payload = replaceSetupMatchesInputSchema.parse(input);
  const json = await api.put(`/api/tournaments/${slug}/setup/matches`, payload);
  return tournamentSetupResponseSchema.parse(json).setup;
}

export async function applyTournamentSetup(slug: string): Promise<TournamentSetup> {
  const json = await api.post(`/api/tournaments/${slug}/setup/apply`, {});
  return applyTournamentSetupResponseSchema.parse(json).setup;
}
