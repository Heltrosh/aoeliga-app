import type {
  RulesetConfig,
  RulesetMatchFormat,
  RulesetScoringSystem,
  RulesetStage,
} from "../../api/schemas/rulesets";

export function titleCaseFromSnake(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getMatchFormatEntries(
  formats: RulesetConfig["match_formats"],
): Array<[string, RulesetMatchFormat]> {
  return Object.entries(formats) as Array<[string, RulesetMatchFormat]>;
}

export function getScoringSystemEntries(
  scoringSystems: RulesetConfig["scoring_systems"],
): Array<[string, RulesetScoringSystem]> {
  return Object.entries(scoringSystems) as Array<[string, RulesetScoringSystem]>;
}

export function formatMatchFormatLabel(format: RulesetMatchFormat): string {
  switch (format.type) {
    case "best_of":
      return `Best of ${format.games}`;
    case "play_all":
      return `Play all ${format.games}`;
  }
}

export function formatScoringSystemLabel(system: RulesetScoringSystem): string {
  switch (system.type) {
    case "match_points":
      return `Win ${system.win} • Draw ${system.draw ?? 0} • Loss ${system.loss}`;
    case "game_points":
      return `Game points: Win ${system.per_game_win} • Loss ${system.per_game_loss}`;
    case "hybrid":
      return `Hybrid: Match Win ${system.match_win}, Match Loss ${system.match_loss}, Game Win ${system.game_win}, Game Loss ${system.game_loss}`;
  }
}

export function formatStageType(type: RulesetStage["type"]): string {
  switch (type) {
    case "round_robin":
      return "Round Robin";
    case "single_elimination":
      return "Single Elimination";
    case "double_elimination":
      return "Double Elimination";
  }
}

export function formatParticipants(stage: RulesetStage, config: RulesetConfig): string {
  const participants = stage.participants;

  if (participants.source === "division_players") {
    return "All players in the division";
  }

  const sourceStage =
    config.stages.find((candidate) => candidate.id === participants.stage_id)?.name ??
    titleCaseFromSnake(participants.stage_id);

  switch (participants.selector.type) {
    case "top_n":
      return `Top ${participants.selector.count} players from ${sourceStage}`;
    case "all":
      return `All players from ${sourceStage}`;
    default:
      return `Players from ${sourceStage}`;
  }
}

export function formatCadence(config: RulesetConfig, stage: RulesetStage): string {
  const days =
    stage.cadence?.round_duration_days ?? config.calendar?.round_duration_days;

  if (!days) return "Not specified";
  if (days === 1) return "1 round per day";
  return `1 round every ${days} days`;
}

export function formatAdvancement(stage: RulesetStage, config: RulesetConfig): string | null {
  if (!stage.advancement) return null;

  switch (stage.advancement.type) {
    case "top_n": {
      const nextStage = getNextStage(stage, config);
      return nextStage
        ? `Top ${stage.advancement.count} players advance to ${nextStage.name}`
        : `Top ${stage.advancement.count} players advance`;
    }
    default:
      return titleCaseFromSnake(stage.advancement.type);
  }
}

export function formatSeeding(stage: RulesetStage, config: RulesetConfig): string | null {
  if (!stage.seeding) return null;

  switch (stage.seeding.type) {
    case "previous_stage_rank": {
      const participants = stage.participants;
      if (participants.source === "previous_stage") {
        const sourceStage =
          config.stages.find((candidate) => candidate.id === participants.stage_id)?.name ??
          titleCaseFromSnake(participants.stage_id);

        return `Based on ${sourceStage} ranking`;
      }
      return "Based on previous stage ranking";
    }
    default:
      return titleCaseFromSnake(stage.seeding.type);
  }
}

export function formatRoundRobinDetails(stage: RulesetStage): string | null {
  if (stage.type !== "round_robin") return null;

  if (stage.round_robin.legs === 1) {
    return "1 leg (each pairing is played once)";
  }

  return `${stage.round_robin.legs} legs`;
}

export function formatMatchPolicy(
  stage: RulesetStage,
  config: RulesetConfig,
): Array<{ label: string; value: string }> {
  const items: Array<{ label: string; value: string }> = [];

  const defaultFormat = config.match_formats[stage.match_format_policy.default_format];

  items.push({
    label: "Default",
    value: defaultFormat
      ? formatMatchFormatLabel(defaultFormat)
      : stage.match_format_policy.default_format,
  });

  for (const override of stage.match_format_policy.overrides ?? []) {
    const overrideFormat = config.match_formats[override.format];
    const value = overrideFormat
      ? formatMatchFormatLabel(overrideFormat)
      : override.format;

    if (override.round_number) {
      items.push({
        label: `Round ${override.round_number}`,
        value,
      });
      continue;
    }

    if (override.round) {
      items.push({
        label: titleCaseFromSnake(override.round),
        value,
      });
    }
  }

  return items;
}

export function formatTiebreakerLabel(value: string): string {
  switch (value) {
    case "match_points":
      return "Match points";
    case "head_to_head":
      return "Head-to-head";
    case "game_difference":
      return "Game difference";
    case "games_won":
      return "Games won";
    default:
      return titleCaseFromSnake(value);
  }
}

export function getTournamentStructureSummary(config: RulesetConfig): string {
  return config.stages.map((stage) => stage.name).join(" → ");
}

export function getPrimaryStageFormatsSummary(config: RulesetConfig): string {
  return config.stages
    .map((stage) => `${stage.name}: ${formatStageType(stage.type)}`)
    .join(" • ");
}

function getNextStage(stage: RulesetStage, config: RulesetConfig): RulesetStage | null {
  const currentIndex = config.stages.findIndex((candidate) => candidate.id === stage.id);
  if (currentIndex === -1) return null;
  return config.stages[currentIndex + 1] ?? null;
}