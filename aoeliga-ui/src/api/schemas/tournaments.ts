import { z } from "zod";

import { tournamentStatusSchema } from "./statuses";

export const tournamentRoleSchema = z.union([z.literal("admin"), z.literal("moderator"), z.null()]);

export const tournamentViewerSchema = z.object({
  is_authenticated: z.boolean(),
  is_global_admin: z.boolean(),
  tournament_role: tournamentRoleSchema,
  is_tournament_streamer: z.boolean(),
  is_tournament_player: z.boolean(),
});

export const tournamentCapabilitiesSchema = z.object({
  can_manage_tournament: z.boolean(),
  can_manage_players: z.boolean(),
  can_assign_admins: z.boolean(),
  can_assign_streamers: z.boolean(),
  can_manage_matches: z.boolean(),
  can_access_streamer_tools: z.boolean(),
});

export const tournamentSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: tournamentStatusSchema,
  default_ruleset: z.number().nullable(),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  created_at: z.string().optional(),
});

export const tournamentListCapabilitiesSchema = z.object({
  can_edit: z.boolean(),
  can_delete: z.boolean(),
});

export const tournamentListItemSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: tournamentStatusSchema,
  default_ruleset: z.number().nullable(),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  capabilities: tournamentListCapabilitiesSchema,
});

export const listTournamentsResponseSchema = z.object({
  tournaments: z.array(tournamentListItemSchema),
});

export const createTournamentInputSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable(),
  default_ruleset: z.number().nullable().optional(),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
});

export const updateTournamentInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable(),
  status: tournamentStatusSchema,
  default_ruleset: z.number().nullable().optional(),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
});

export const tournamentContextResponseSchema = z.object({
  tournament: tournamentSchema,
  viewer: tournamentViewerSchema,
  capabilities: tournamentCapabilitiesSchema,
});

export const tournamentAdminRowSchema = z.object({
  user_id: z.number(),
  role: z.enum(["admin", "moderator"]),
  discord_id: z.string().nullable(),
  discord_name: z.string().nullable(),
  display_name: z.string().nullable(),
  avatar: z.string().nullable(),
});

export const tournamentAdminsResponseSchema = z.object({
  admins: z.array(tournamentAdminRowSchema),
});

export const tournamentStreamerRowSchema = z.object({
  user_id: z.number(),
  stream_url: z.string().nullable().optional(),
  discord_id: z.string().nullable(),
  discord_name: z.string().nullable(),
  display_name: z.string().nullable().optional(),
  avatar: z.string().nullable(),
});

export const tournamentStreamersResponseSchema = z.object({
  streamers: z.array(tournamentStreamerRowSchema),
});

export const tournamentPlayerRowSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  aoe_id: z.string(),
  status: z.string(),
  division_id: z.number().nullable().optional(),
  division_name: z.string().nullable().optional(),
  discord_id: z.string().nullable(),
  discord_name: z.string().nullable(),
  display_name: z.string().nullable(),
  avatar: z.string().nullable(),
});

export const tournamentPlayersResponseSchema = z.object({
  players: z.array(tournamentPlayerRowSchema),
});

export type TournamentRole = z.infer<typeof tournamentRoleSchema>;
export type TournamentViewer = z.infer<typeof tournamentViewerSchema>;
export type TournamentCapabilities = z.infer<typeof tournamentCapabilitiesSchema>;
export type Tournament = z.infer<typeof tournamentSchema>;
export type TournamentListItem = z.infer<typeof tournamentListItemSchema>;
export type ListTournamentsResponse = z.infer<typeof listTournamentsResponseSchema>;
export type CreateTournamentInput = z.infer<typeof createTournamentInputSchema>;
export type UpdateTournamentInput = z.infer<typeof updateTournamentInputSchema>;
export type TournamentContextResponse = z.infer<typeof tournamentContextResponseSchema>;
export type TournamentAdminRow = z.infer<typeof tournamentAdminRowSchema>;
export type TournamentStreamerRow = z.infer<typeof tournamentStreamerRowSchema>;
export type TournamentPlayerRow = z.infer<typeof tournamentPlayerRowSchema>;
