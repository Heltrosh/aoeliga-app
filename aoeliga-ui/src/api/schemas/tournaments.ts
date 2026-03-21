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
  registrations_open: z.number().optional().default(0),
  recent_games_days: z.number().nullable().optional().default(null),
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
  registrations_open: z.number().optional().default(0),
  recent_games_days: z.number().nullable().optional().default(null),
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
  display_name: z.string().nullable(),
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

/* registrations */

export const tournamentRegistrationStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "withdrawn",
]);

export const tournamentRegistrationSelfCapabilitiesSchema = z.object({
  can_create: z.boolean(),
  can_edit: z.boolean(),
  can_withdraw: z.boolean(),
});

export const tournamentRegistrationSelfSchema = z.object({
  id: z.number(),
  tournament_id: z.number(),
  user_id: z.number(),
  aoe_id: z.string(),
  aoe_name: z.string(),
  status: tournamentRegistrationStatusSchema,
  submitted_at: z.string(),
  updated_at: z.string(),
  note: z.string().nullable(),
});

export const tournamentRegistrationSelfResponseSchema = z.object({
  registration: tournamentRegistrationSelfSchema.nullable(),
  capabilities: tournamentRegistrationSelfCapabilitiesSchema,
});

const aoe2CompanionUrlSchema = z
  .string()
  .trim()
  .regex(
    /^(?:https?:\/\/)?(?:www\.)?aoe2companion\.com\/players\/\d+(?:\/)?(?:[?#].*)?$/i,
    "Enter a valid AoE2Companion player URL",
  );

export const createTournamentRegistrationInputSchema = z.object({
  aoe2companion_url: aoe2CompanionUrlSchema,
  note: z.string().nullable(),
});

export const staffTournamentRegistrationUserSchema = z.object({
  id: z.number(),
  discord_id: z.string().nullable(),
  discord_name: z.string().nullable(),
  display_name: z.string().nullable(),
  avatar: z.string().nullable(),
});

export const staffTournamentRegistrationSchema = z.object({
  id: z.number(),
  tournament_id: z.number(),
  user_id: z.number(),
  aoe_id: z.string(),
  aoe_name: z.string(),
  signup_rating: z.number().nullable(),
  signup_max_rating: z.number().nullable(),
  signup_team_rating: z.number().nullable(),
  signup_max_team_rating: z.number().nullable(),
  current_rating: z.number().nullable(),
  current_max_rating: z.number().nullable(),
  current_team_rating: z.number().nullable(),
  current_max_team_rating: z.number().nullable(),
  current_data_fetched_at: z.string().nullable(),
  total_games: z.number().nullable(),
  recent_games: z.number().nullable(),
  status: tournamentRegistrationStatusSchema,
  submitted_at: z.string(),
  updated_at: z.string(),
  reviewed_at: z.string().nullable(),
  reviewed_by: z.number().nullable(),
  note: z.string().nullable(),
  review_note: z.string().nullable(),
  user: staffTournamentRegistrationUserSchema,
});

export const staffTournamentRegistrationsResponseSchema = z.object({
  registrations: z.array(staffTournamentRegistrationSchema),
});

export const reviewTournamentRegistrationInputSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  review_note: z.string().nullable().optional(),
});

export const createStaffTournamentRegistrationInputSchema = z.object({
  user_id: z.number(),
  aoe2companion_url: aoe2CompanionUrlSchema,
  note: z.string().nullable(),
});

export const registrationSettingsInputSchema = z.object({
  registrations_open: z.boolean(),
  recent_games_days: z.number().int().positive().nullable().optional(),
});

export const registrationSettingsResponseSchema = z.object({
  ok: z.boolean(),
  registration_settings: z.object({
    registrations_open: z.boolean(),
    recent_games_days: z.number().nullable(),
  }),
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

export type TournamentRegistrationSelf = z.infer<typeof tournamentRegistrationSelfSchema>;
export type TournamentRegistrationSelfResponse = z.infer<typeof tournamentRegistrationSelfResponseSchema>;
export type CreateTournamentRegistrationInput = z.infer<typeof createTournamentRegistrationInputSchema>;
export type StaffTournamentRegistration = z.infer<typeof staffTournamentRegistrationSchema>;
export type StaffTournamentRegistrationsResponse = z.infer<typeof staffTournamentRegistrationsResponseSchema>;
export type ReviewTournamentRegistrationInput = z.infer<typeof reviewTournamentRegistrationInputSchema>;
export type CreateStaffTournamentRegistrationInput = z.infer<typeof createStaffTournamentRegistrationInputSchema>;
export type RegistrationSettingsInput = z.infer<typeof registrationSettingsInputSchema>;