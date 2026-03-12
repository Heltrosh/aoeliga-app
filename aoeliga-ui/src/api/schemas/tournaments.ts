import { z } from "zod";

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
  status: z.string(),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  created_at: z.string().optional(),
});

export const tournamentDetailResponseSchema = z.object({
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
export type TournamentDetailResponse = z.infer<typeof tournamentDetailResponseSchema>;
export type TournamentAdminRow = z.infer<typeof tournamentAdminRowSchema>;
export type TournamentStreamerRow = z.infer<typeof tournamentStreamerRowSchema>;
export type TournamentPlayerRow = z.infer<typeof tournamentPlayerRowSchema>;
