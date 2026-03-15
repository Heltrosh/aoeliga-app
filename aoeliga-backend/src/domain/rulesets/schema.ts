import { z } from 'zod';
import {
  RULESET_ADVANCEMENT_TYPES,
  RULESET_MATCH_FORMAT_TYPES,
  RULESET_PARTICIPANT_SOURCES,
  RULESET_ROUND_LABELS,
  RULESET_SCORING_TYPES,
  RULESET_STAGE_TYPES,
  RULESET_TIEBREAKERS,
} from './catalog';

const roundLabelSchema = z.enum(RULESET_ROUND_LABELS);
const stageTypeSchema = z.enum(RULESET_STAGE_TYPES);
const participantSourceSchema = z.enum(RULESET_PARTICIPANT_SOURCES);
const matchFormatTypeSchema = z.enum(RULESET_MATCH_FORMAT_TYPES);
const scoringTypeSchema = z.enum(RULESET_SCORING_TYPES);
const advancementTypeSchema = z.enum(RULESET_ADVANCEMENT_TYPES);
const tiebreakerSchema = z.enum(RULESET_TIEBREAKERS);

export const bestOfMatchFormatSchema = z.object({
  type: z.literal('best_of'),
  games: z.number().int().min(1).max(21).refine((v) => v % 2 === 1, {
    message: 'best_of games must be odd',
  }),
});

export const playAllMatchFormatSchema = z.object({
  type: z.literal('play_all'),
  games: z.number().int().min(1).max(21),
});

export const rulesetMatchFormatSchema = z.discriminatedUnion('type', [
  bestOfMatchFormatSchema,
  playAllMatchFormatSchema,
]);

const matchPointsScoringSchema = z.object({
  type: z.literal('match_points'),
  win: z.number(),
  loss: z.number(),
  draw: z.number().default(0),
});

const gamePointsScoringSchema = z.object({
  type: z.literal('game_points'),
  per_game_win: z.number(),
  per_game_loss: z.number().default(0),
});

const hybridScoringSchema = z.object({
  type: z.literal('hybrid'),
  match_win: z.number(),
  match_loss: z.number().default(0),
  game_win: z.number(),
  game_loss: z.number().default(0),
  draw: z.number().default(0),
});

export const rulesetScoringSystemSchema = z.discriminatedUnion('type', [
  matchPointsScoringSchema,
  gamePointsScoringSchema,
  hybridScoringSchema,
]);

export const stageParticipantSchema = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('division_players'),
  }),
  z.object({
    source: z.literal('previous_stage'),
    stage_id: z.string().min(1),
    selector: z.object({
      type: advancementTypeSchema,
      count: z.number().int().min(1).optional(),
    }),
  }),
]);

export const stageCadenceSchema = z.object({
  round_duration_days: z.number().int().min(1).max(365),
});

export const matchFormatOverrideSchema = z.object({
  round_number: z.number().int().min(1).optional(),
  round: roundLabelSchema.optional(),
  format: z.string().min(1),
}).refine((value) => value.round_number != null || value.round != null, {
  message: 'match format override must specify round_number or round',
});

export const stageMatchFormatPolicySchema = z.object({
  default_format: z.string().min(1),
  overrides: z.array(matchFormatOverrideSchema).default([]),
});

export const stageAdvancementSchema = z.object({
  type: advancementTypeSchema,
  count: z.number().int().min(1).optional(),
});

export const stageSeedingSchema = z.object({
  type: z.enum(['seed', 'previous_stage_rank', 'manual']),
});

const stageBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: stageTypeSchema,
  participants: stageParticipantSchema,
  cadence: stageCadenceSchema.optional(),
  match_format_policy: stageMatchFormatPolicySchema,
  scoring: z.object({ system: z.string().min(1) }).optional(),
  advancement: stageAdvancementSchema.optional(),
  tiebreakers: z.array(tiebreakerSchema).default([]),
  seeding: stageSeedingSchema.optional(),
});

const roundRobinStageSchema = stageBaseSchema.extend({
  type: z.literal('round_robin'),
  round_robin: z.object({
    legs: z.number().int().min(1).max(4).default(1),
  }),
});

const singleEliminationStageSchema = stageBaseSchema.extend({
  type: z.literal('single_elimination'),
  single_elimination: z.object({
    third_place_match: z.boolean().default(false),
    allow_byes: z.boolean().default(true),
  }).default({ third_place_match: false, allow_byes: true }),
});

const doubleEliminationStageSchema = stageBaseSchema.extend({
  type: z.literal('double_elimination'),
  double_elimination: z.object({
    grand_final_reset: z.boolean().default(false),
  }).default({ grand_final_reset: false }),
});

export const rulesetStageSchema = z.discriminatedUnion('type', [
  roundRobinStageSchema,
  singleEliminationStageSchema,
  doubleEliminationStageSchema,
]);

export const rulesetSchema = z.object({
  version: z.number().int().min(1),
  calendar: z.object({
    round_duration_days: z.number().int().min(1).max(365).default(7),
  }).default({ round_duration_days: 7 }),
  match_formats: z.record(z.string().min(1), rulesetMatchFormatSchema),
  scoring_systems: z.record(z.string().min(1), rulesetScoringSystemSchema),
  stages: z.array(rulesetStageSchema).min(1),
}).superRefine((ruleset, ctx) => {
  const stageIds = new Set<string>();
  for (const stage of ruleset.stages) {
    if (stageIds.has(stage.id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate stage id: ${stage.id}` });
    }
    stageIds.add(stage.id);

    if (!ruleset.match_formats[stage.match_format_policy.default_format]) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `unknown default match format for stage ${stage.id}` });
    }

    for (const override of stage.match_format_policy.overrides) {
      if (!ruleset.match_formats[override.format]) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `unknown match format override for stage ${stage.id}` });
      }
    }

    if (stage.scoring && !ruleset.scoring_systems[stage.scoring.system]) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `unknown scoring system for stage ${stage.id}` });
    }

    if (stage.type === 'round_robin' && !stage.scoring) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `round_robin stage ${stage.id} requires scoring` });
    }

    if (stage.participants.source === 'previous_stage' && !stageIds.has(stage.participants.stage_id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `stage ${stage.id} references previous unknown stage ${stage.participants.stage_id}` });
    }
  }
});

export type Ruleset = z.infer<typeof rulesetSchema>;
export type RulesetStage = z.infer<typeof rulesetStageSchema>;
export type RulesetMatchFormat = z.infer<typeof rulesetMatchFormatSchema>;
export type RulesetScoringSystem = z.infer<typeof rulesetScoringSystemSchema>;
export type RulesetStageType = z.infer<typeof stageTypeSchema>;
