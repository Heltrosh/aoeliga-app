import type { RulesetConfig, RulesetStage } from "../../../api/schemas/rulesets";

export type EditorMode = "guided" | "raw";

export type MatchFormatEditor = {
  localId: string;
  key: string;
  type: "best_of" | "play_all";
  games: number;
};

export type ScoringSystemEditor =
  | {
      localId: string;
      key: string;
      type: "match_points";
      win: number;
      draw: number;
      loss: number;
    }
  | {
      localId: string;
      key: string;
      type: "game_points";
      per_game_win: number;
      per_game_loss: number;
    }
  | {
      localId: string;
      key: string;
      type: "hybrid";
      match_win: number;
      match_loss: number;
      game_win: number;
      game_loss: number;
    };

export type StageOverrideEditor = {
  localId: string;
  round: string;
  roundNumber: number | null;
  format: string;
};

export type StageEditor = {
  localId: string;
  id: string;
  name: string;
  type: "round_robin" | "single_elimination" | "double_elimination";
  participantSource: "division_players" | "previous_stage";
  participantStageId: string;
  participantSelectorType: string;
  participantSelectorCount: number | null;
  cadenceDays: number | null;
  defaultFormat: string;
  overrides: StageOverrideEditor[];
  advancementType: string;
  advancementCount: number | null;
  seedingType: string;
  roundRobinLegs: number;
  scoringSystem: string;
  tiebreakers: string[];
};

export type GuidedRulesetEditorState = {
  name: string;
  version: number;
  defaultRoundDurationDays: number | null;
  matchFormats: MatchFormatEditor[];
  scoringSystems: ScoringSystemEditor[];
  stages: StageEditor[];
};

export const TIEBREAKER_OPTIONS = [
  { value: "match_points", label: "Match points" },
  { value: "head_to_head", label: "Head-to-head" },
  { value: "game_difference", label: "Game difference" },
  { value: "games_won", label: "Games won" },
];

export function createLocalId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function numberInputValue(
  value: number | null | undefined,
): number | undefined {
  return value ?? undefined;
}

export function removeByLocalId<T extends { localId: string }>(
  items: T[],
  localId: string,
) {
  return items.filter((item) => item.localId !== localId);
}

export function stageTypeOptions() {
  return [
    { value: "round_robin", label: "Round Robin" },
    { value: "single_elimination", label: "Single Elimination" },
    { value: "double_elimination", label: "Double Elimination" },
  ];
}

export function participantSourceOptions() {
  return [
    { value: "division_players", label: "All players in the division" },
    { value: "previous_stage", label: "Players from a previous stage" },
  ];
}

export function matchFormatTypeOptions() {
  return [
    { value: "best_of", label: "Best of" },
    { value: "play_all", label: "Play all games" },
  ];
}

export function scoringSystemTypeOptions() {
  return [
    { value: "match_points", label: "Match points" },
    { value: "game_points", label: "Game points" },
    { value: "hybrid", label: "Hybrid" },
  ];
}

export function makeDefaultGuidedState(): GuidedRulesetEditorState {
  return {
    name: "",
    version: 1,
    defaultRoundDurationDays: 7,
    matchFormats: [
      { localId: createLocalId("fmt"), key: "bo3", type: "best_of", games: 3 },
      { localId: createLocalId("fmt"), key: "bo5", type: "best_of", games: 5 },
    ],
    scoringSystems: [
      {
        localId: createLocalId("score"),
        key: "league_points",
        type: "match_points",
        win: 3,
        draw: 0,
        loss: 0,
      },
    ],
    stages: [
      {
        localId: createLocalId("stage"),
        id: "group_stage",
        name: "Group Stage",
        type: "round_robin",
        participantSource: "division_players",
        participantStageId: "",
        participantSelectorType: "top_n",
        participantSelectorCount: 4,
        cadenceDays: 7,
        defaultFormat: "bo3",
        overrides: [],
        advancementType: "top_n",
        advancementCount: 4,
        seedingType: "",
        roundRobinLegs: 1,
        scoringSystem: "league_points",
        tiebreakers: ["match_points", "head_to_head", "game_difference", "games_won"],
      },
    ],
  };
}

export function configToGuidedState(
  name: string,
  config: RulesetConfig,
): GuidedRulesetEditorState {
  const matchFormats: MatchFormatEditor[] = Object.entries(config.match_formats).map(
    ([key, value]) => ({
      localId: createLocalId("fmt"),
      key,
      type: value.type,
      games: value.games,
    }),
  );

  const scoringSystems: ScoringSystemEditor[] = Object.entries(
    config.scoring_systems,
  ).map(([key, value]) => {
    if (value.type === "match_points") {
      return {
        localId: createLocalId("score"),
        key,
        type: "match_points",
        win: value.win,
        draw: value.draw ?? 0,
        loss: value.loss,
      };
    }

    if (value.type === "game_points") {
      return {
        localId: createLocalId("score"),
        key,
        type: "game_points",
        per_game_win: value.per_game_win,
        per_game_loss: value.per_game_loss,
      };
    }

    return {
      localId: createLocalId("score"),
      key,
      type: "hybrid",
      match_win: value.match_win,
      match_loss: value.match_loss,
      game_win: value.game_win,
      game_loss: value.game_loss,
    };
  });

  const stages: StageEditor[] = config.stages.map((stage) => ({
    localId: createLocalId("stage"),
    id: stage.id,
    name: stage.name,
    type: stage.type,
    participantSource: stage.participants.source,
    participantStageId:
      stage.participants.source === "previous_stage"
        ? stage.participants.stage_id
        : "",
    participantSelectorType:
      stage.participants.source === "previous_stage"
        ? stage.participants.selector.type
        : "top_n",
    participantSelectorCount:
      stage.participants.source === "previous_stage"
        ? stage.participants.selector.count ?? null
        : null,
    cadenceDays: stage.cadence?.round_duration_days ?? null,
    defaultFormat: stage.match_format_policy.default_format,
    overrides: (stage.match_format_policy.overrides ?? []).map((override) => ({
      localId: createLocalId("override"),
      round: override.round ?? "",
      roundNumber: override.round_number ?? null,
      format: override.format,
    })),
    advancementType: stage.advancement?.type ?? "",
    advancementCount: stage.advancement?.count ?? null,
    seedingType: stage.seeding?.type ?? "",
    roundRobinLegs: stage.type === "round_robin" ? stage.round_robin.legs : 1,
    scoringSystem: stage.type === "round_robin" ? stage.scoring.system : "",
    tiebreakers: stage.tiebreakers ?? [],
  }));

  return {
    name,
    version: config.version,
    defaultRoundDurationDays: config.calendar?.round_duration_days ?? null,
    matchFormats,
    scoringSystems,
    stages,
  };
}

export function guidedStateToConfig(
  state: GuidedRulesetEditorState,
): RulesetConfig {
  const match_formats: RulesetConfig["match_formats"] = {};
  for (const format of state.matchFormats) {
    if (!format.key.trim()) continue;

    match_formats[format.key.trim()] = {
      type: format.type,
      games: Number(format.games) || 1,
    };
  }

  const scoring_systems: RulesetConfig["scoring_systems"] = {};
  for (const scoring of state.scoringSystems) {
    if (!scoring.key.trim()) continue;

    if (scoring.type === "match_points") {
      scoring_systems[scoring.key.trim()] = {
        type: "match_points",
        win: Number(scoring.win) || 0,
        draw: Number(scoring.draw) || 0,
        loss: Number(scoring.loss) || 0,
      };
      continue;
    }

    if (scoring.type === "game_points") {
      scoring_systems[scoring.key.trim()] = {
        type: "game_points",
        per_game_win: Number(scoring.per_game_win) || 0,
        per_game_loss: Number(scoring.per_game_loss) || 0,
      };
      continue;
    }

    scoring_systems[scoring.key.trim()] = {
      type: "hybrid",
      match_win: Number(scoring.match_win) || 0,
      match_loss: Number(scoring.match_loss) || 0,
      game_win: Number(scoring.game_win) || 0,
      game_loss: Number(scoring.game_loss) || 0,
    };
  }

  const stages: RulesetStage[] = state.stages.map((stage) => {
    const common = {
      id: stage.id.trim(),
      name: stage.name.trim(),
      participants:
        stage.participantSource === "division_players"
          ? { source: "division_players" as const }
          : {
              source: "previous_stage" as const,
              stage_id: stage.participantStageId.trim(),
              selector: {
                type: stage.participantSelectorType || "top_n",
                ...(stage.participantSelectorCount != null
                  ? { count: Number(stage.participantSelectorCount) || 1 }
                  : {}),
              },
            },
      ...(stage.cadenceDays != null
        ? {
            cadence: {
              round_duration_days: Number(stage.cadenceDays) || 1,
            },
          }
        : {}),
      match_format_policy: {
        default_format: stage.defaultFormat,
        overrides: stage.overrides
          .filter((override) => override.format.trim().length > 0)
          .map((override) => ({
            ...(override.round.trim().length > 0
              ? { round: override.round.trim() }
              : {}),
            ...(override.roundNumber != null
              ? { round_number: Number(override.roundNumber) }
              : {}),
            format: override.format.trim(),
          })),
      },
      ...(stage.advancementType.trim().length > 0
        ? {
            advancement: {
              type: stage.advancementType.trim(),
              ...(stage.advancementCount != null
                ? { count: Number(stage.advancementCount) || 1 }
                : {}),
            },
          }
        : {}),
      ...(stage.seedingType.trim().length > 0
        ? {
            seeding: {
              type: stage.seedingType.trim(),
            },
          }
        : {}),
      tiebreakers: stage.tiebreakers,
    };

    if (stage.type === "round_robin") {
      return {
        ...common,
        type: "round_robin" as const,
        round_robin: {
          legs: Number(stage.roundRobinLegs) || 1,
        },
        scoring: {
          system: stage.scoringSystem,
        },
      };
    }

    if (stage.type === "single_elimination") {
      return {
        ...common,
        type: "single_elimination" as const,
      };
    }

    return {
      ...common,
      type: "double_elimination" as const,
    };
  });

  return {
    version: Number(state.version) || 1,
    ...(state.defaultRoundDurationDays != null
      ? {
          calendar: {
            round_duration_days: Number(state.defaultRoundDurationDays) || 1,
          },
        }
      : {}),
    match_formats,
    scoring_systems,
    stages,
  };
}