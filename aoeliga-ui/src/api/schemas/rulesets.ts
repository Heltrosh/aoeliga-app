import { z } from "zod";

export const rulesetMatchFormatSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("best_of"),
    games: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("play_all"),
    games: z.number().int().positive(),
  }),
]);

export const rulesetScoringSystemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("match_points"),
    win: z.number(),
    loss: z.number(),
    draw: z.number().optional().default(0),
  }),
  z.object({
    type: z.literal("game_points"),
    per_game_win: z.number(),
    per_game_loss: z.number(),
  }),
  z.object({
    type: z.literal("hybrid"),
    match_win: z.number(),
    match_loss: z.number(),
    game_win: z.number(),
    game_loss: z.number(),
  }),
]);

export const rulesetMatchFormatOverrideSchema = z.object({
  round_number: z.number().int().positive().optional(),
  round: z.string().optional(),
  format: z.string(),
});

export const rulesetMatchFormatPolicySchema = z.object({
  default_format: z.string(),
  overrides: z.array(rulesetMatchFormatOverrideSchema).optional().default([]),
});

export const rulesetParticipantsSchema = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("division_players"),
  }),
  z.object({
    source: z.literal("previous_stage"),
    stage_id: z.string(),
    selector: z.object({
      type: z.string(),
      count: z.number().int().positive().optional(),
    }),
  }),
]);

export const rulesetCadenceSchema = z.object({
  round_duration_days: z.number().int().positive().optional(),
});

export const rulesetStageBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  participants: rulesetParticipantsSchema,
  cadence: rulesetCadenceSchema.optional(),
  match_format_policy: rulesetMatchFormatPolicySchema,
  advancement: z
    .object({
      type: z.string(),
      count: z.number().int().positive().optional(),
    })
    .optional(),
  tiebreakers: z.array(z.string()).optional().default([]),
  seeding: z
    .object({
      type: z.string(),
    })
    .optional(),
});

export const roundRobinStageSchema = rulesetStageBaseSchema.extend({
  type: z.literal("round_robin"),
  round_robin: z.object({
    legs: z.number().int().positive(),
  }),
  scoring: z.object({
    system: z.string(),
  }),
});

export const singleEliminationStageSchema = rulesetStageBaseSchema.extend({
  type: z.literal("single_elimination"),
  single_elimination: z
    .object({
      third_place_match: z.boolean().optional(),
      allow_byes: z.boolean().optional(),
    })
    .optional(),
});

export const doubleEliminationStageSchema = rulesetStageBaseSchema.extend({
  type: z.literal("double_elimination"),
  double_elimination: z
    .object({
      grand_final_reset: z.boolean().optional(),
      allow_byes: z.boolean().optional(),
    })
    .optional(),
});

export const rulesetStageSchema = z.discriminatedUnion("type", [
  roundRobinStageSchema,
  singleEliminationStageSchema,
  doubleEliminationStageSchema,
]);

export const rulesetConfigSchema = z.object({
  version: z.number().int().positive(),
  calendar: z
    .object({
      round_duration_days: z.number().int().positive().optional(),
    })
    .optional(),
  match_formats: z.record(z.string(), rulesetMatchFormatSchema),
  scoring_systems: z.record(z.string(), rulesetScoringSystemSchema),
  stages: z.array(rulesetStageSchema),
});

export const rulesetSummaryStageSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  default_format: z.string().nullable(),
  scoring_system: z.string().nullable(),
});

export const rulesetSummarySchema = z.object({
  version: z.number().int().positive(),
  stage_count: z.number().int().nonnegative(),
  stages: z.array(rulesetSummaryStageSchema),
});

export const rulesetUsageTournamentSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
});

export const rulesetUsageDivisionSchema = z.object({
  id: z.number(),
  name: z.string(),
  tournament_id: z.number(),
  tournament_name: z.string(),
  tournament_slug: z.string(),
});

export const rulesetUsageSchema = z.object({
  tournament_default_count: z.number().int().nonnegative(),
  division_count: z.number().int().nonnegative(),
  is_in_use: z.boolean(),
  tournament_defaults: z.array(rulesetUsageTournamentSchema).optional().default([]),
  divisions: z.array(rulesetUsageDivisionSchema).optional().default([]),
});

export const rulesetPermissionsSchema = z.object({
  can_edit: z.boolean(),
  can_delete: z.boolean(),
});

export const rulesetLifecycleSchema = z.object({
  is_locked: z.boolean(),
  lock_reason: z.string().nullable(),
});

export const rulesetListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.string().optional(),
  created_by_user_id: z.number().nullable().optional(),
  creator_display_name: z.string().nullable().optional(),
  creator_discord_name: z.string().nullable().optional(),
  summary: rulesetSummarySchema,
  usage: rulesetUsageSchema,
  permissions: rulesetPermissionsSchema,
  lifecycle: rulesetLifecycleSchema,
});

export const rulesetsListResponseSchema = z.object({
  rulesets: z.array(rulesetListItemSchema),
});

export const rulesetDetailDataSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.string().optional(),
  created_by_user_id: z.number().nullable().optional(),
  creator_display_name: z.string().nullable().optional(),
  creator_discord_name: z.string().nullable().optional(),
  config: rulesetConfigSchema,
  summary: rulesetSummarySchema,
  usage: rulesetUsageSchema,
  permissions: rulesetPermissionsSchema,
  lifecycle: rulesetLifecycleSchema,
});

export const rulesetDetailResponseSchema = z.object({
  ruleset: rulesetDetailDataSchema,
});

export const rulesetMutationResponseSchema = z.object({
  ok: z.boolean(),
  ruleset: rulesetDetailDataSchema,
});

export const rulesetDeleteResponseSchema = z.object({
  ok: z.boolean(),
});

export const createRulesetInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  config: z.unknown(),
});

export const updateRulesetInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  config: z.unknown(),
});

export type RulesetConfig = z.infer<typeof rulesetConfigSchema>;
export type RulesetStage = z.infer<typeof rulesetStageSchema>;
export type RulesetListItem = z.infer<typeof rulesetListItemSchema>;
export type RulesetDetail = z.infer<typeof rulesetDetailDataSchema>;
export type RulesetMatchFormat = z.infer<typeof rulesetMatchFormatSchema>;
export type RulesetScoringSystem = z.infer<typeof rulesetScoringSystemSchema>;
export type CreateRulesetInput = z.infer<typeof createRulesetInputSchema>;
export type UpdateRulesetInput = z.infer<typeof updateRulesetInputSchema>;