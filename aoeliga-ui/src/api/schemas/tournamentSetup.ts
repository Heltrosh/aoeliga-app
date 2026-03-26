import { z } from "zod";

export const tournamentSetupSessionStatusSchema = z.enum(["draft", "ready", "applied"]);
export const tournamentSetupDistributionModeSchema = z.enum(["rating", "random"]);
export const tournamentSetupRatingKeySchema = z.enum([
  "signup_rating",
  "signup_max_rating",
  "signup_team_rating",
  "signup_max_team_rating",
  "current_rating",
  "current_max_rating",
  "current_team_rating",
  "current_max_team_rating",
]);

export const tournamentSetupSessionSchema = z.object({
  id: z.number(),
  tournament_id: z.number(),
  status: tournamentSetupSessionStatusSchema,
  distribution_mode: tournamentSetupDistributionModeSchema.nullable(),
  selected_rating_key: tournamentSetupRatingKeySchema.nullable(),
  created_by: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  applied_at: z.string().nullable(),
});

export const tournamentSetupDivisionSchema = z.object({
  id: z.number(),
  setup_session_id: z.number(),
  name: z.string(),
  ruleset_id: z.number().nullable(),
  sort_order: z.number(),
});

export const tournamentSetupEligibleRegistrationSchema = z.object({
  registration_id: z.number(),
  user_id: z.number(),
  aoe_id: z.string(),
  aoe_name: z.string(),
  display_name: z.string().nullable(),
  discord_name: z.string().nullable(),
  avatar: z.string().nullable(),
  signup_rating: z.number().nullable(),
  signup_max_rating: z.number().nullable(),
  signup_team_rating: z.number().nullable(),
  signup_max_team_rating: z.number().nullable(),
  current_rating: z.number().nullable(),
  current_max_rating: z.number().nullable(),
  current_team_rating: z.number().nullable(),
  current_max_team_rating: z.number().nullable(),
  total_games: z.number().nullable(),
  recent_games: z.number().nullable(),
  current_data_fetched_at: z.string().nullable(),
});

export const tournamentSetupAssignmentSchema = z.object({
  id: z.number(),
  setup_session_id: z.number(),
  setup_division_id: z.number(),
  registration_id: z.number(),
  seed: z.number(),
  sort_order: z.number(),
  source_rating_value: z.number().nullable(),
  division_name: z.string(),
  division_sort_order: z.number(),
  user_id: z.number(),
  aoe_id: z.string(),
  aoe_name: z.string(),
  display_name: z.string().nullable(),
  discord_name: z.string().nullable(),
  avatar: z.string().nullable(),
  signup_rating: z.number().nullable(),
  signup_max_rating: z.number().nullable(),
  signup_team_rating: z.number().nullable(),
  signup_max_team_rating: z.number().nullable(),
  current_rating: z.number().nullable(),
  current_max_rating: z.number().nullable(),
  current_team_rating: z.number().nullable(),
  current_max_team_rating: z.number().nullable(),
  total_games: z.number().nullable(),
  recent_games: z.number().nullable(),
  current_data_fetched_at: z.string().nullable(),
});

export const tournamentSetupMatchSchema = z.object({
  id: z.number(),
  setup_session_id: z.number(),
  setup_division_id: z.number(),
  stage_key: z.string(),
  stage_type: z.string(),
  round_number: z.number(),
  round_label: z.string().nullable(),
  week_number: z.number().nullable(),
  format_id: z.string(),
  player1_registration_id: z.number().nullable(),
  player2_registration_id: z.number().nullable(),
  division_name: z.string(),
  division_sort_order: z.number(),
  player1_name: z.string().nullable(),
  player2_name: z.string().nullable(),
});

export const tournamentSetupSchema = z.object({
  session: tournamentSetupSessionSchema,
  divisions: z.array(tournamentSetupDivisionSchema),
  assignments: z.array(tournamentSetupAssignmentSchema),
  matches: z.array(tournamentSetupMatchSchema),
  eligible_registrations: z.array(tournamentSetupEligibleRegistrationSchema),
});

export const tournamentSetupResponseSchema = z.object({
  setup: tournamentSetupSchema,
});

export const updateSetupDivisionsInputSchema = z.object({
  divisions: z.array(
    z.object({
      name: z.string().trim().min(1),
      ruleset_id: z.number().nullable(),
    }),
  ),
});

export const generateSetupAssignmentsInputSchema = z.object({
  distribution_mode: tournamentSetupDistributionModeSchema,
  rating_key: tournamentSetupRatingKeySchema.optional(),
});

export const replaceSetupAssignmentsInputSchema = z.object({
  assignments: z.array(
    z.object({
      registration_id: z.number(),
      setup_division_id: z.number(),
      sort_order: z.number().int().positive().nullable().optional(),
    }),
  ),
});

export const replaceSetupMatchesInputSchema = z.object({
  matches: z.array(
    z.object({
      setup_division_id: z.number(),
      stage_key: z.string().trim().min(1),
      stage_type: z.string().trim().min(1),
      round_number: z.number().int().positive(),
      round_label: z.string().nullable().optional(),
      week_number: z.number().int().positive().nullable().optional(),
      format_id: z.string().trim().min(1),
      player1_registration_id: z.number().nullable().optional(),
      player2_registration_id: z.number().nullable().optional(),
    }),
  ),
});

export const applyTournamentSetupResponseSchema = z.object({
  ok: z.boolean(),
  setup: tournamentSetupSchema,
});

export type TournamentSetupSession = z.infer<typeof tournamentSetupSessionSchema>;
export type TournamentSetupDivision = z.infer<typeof tournamentSetupDivisionSchema>;
export type TournamentSetupEligibleRegistration = z.infer<typeof tournamentSetupEligibleRegistrationSchema>;
export type TournamentSetupAssignment = z.infer<typeof tournamentSetupAssignmentSchema>;
export type TournamentSetupMatch = z.infer<typeof tournamentSetupMatchSchema>;
export type TournamentSetup = z.infer<typeof tournamentSetupSchema>;
export type TournamentSetupResponse = z.infer<typeof tournamentSetupResponseSchema>;
export type UpdateSetupDivisionsInput = z.infer<typeof updateSetupDivisionsInputSchema>;
export type GenerateSetupAssignmentsInput = z.infer<typeof generateSetupAssignmentsInputSchema>;
export type ReplaceSetupAssignmentsInput = z.infer<typeof replaceSetupAssignmentsInputSchema>;
export type ReplaceSetupMatchesInput = z.infer<typeof replaceSetupMatchesInputSchema>;
export type TournamentSetupDistributionMode = z.infer<typeof tournamentSetupDistributionModeSchema>;
export type TournamentSetupRatingKey = z.infer<typeof tournamentSetupRatingKeySchema>;
