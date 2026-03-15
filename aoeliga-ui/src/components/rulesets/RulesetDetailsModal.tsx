import { Fragment } from "react";
import {
  Modal,
  Stack,
  Text,
  Group,
  Badge,
  Divider,
  Loader,
  Center,
  Alert,
  List,
  ThemeIcon,
} from "@mantine/core";
import { IconInfoCircle, IconCheck } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";

import { fetchRulesetById } from "../../api/rulesets";
import { rulesetKeys } from "../../api/queryKeys";
import type {
  RulesetConfig,
  RulesetMatchFormat,
  RulesetScoringSystem,
  RulesetStage,
} from "../../api/schemas/rulesets";

type RulesetDetailsModalProps = {
  opened: boolean;
  onClose: () => void;
  rulesetId: number | null;
};

function getMatchFormatEntries(
  formats: RulesetConfig["match_formats"],
): Array<[string, RulesetMatchFormat]> {
  return Object.entries(formats) as Array<[string, RulesetMatchFormat]>;
}

function getScoringSystemEntries(
  scoringSystems: RulesetConfig["scoring_systems"],
): Array<[string, RulesetScoringSystem]> {
  return Object.entries(scoringSystems) as Array<[string, RulesetScoringSystem]>;
}

function formatMatchFormatLabel(format: RulesetMatchFormat): string {
  switch (format.type) {
    case "best_of":
      return `Best of ${format.games}`;
    case "play_all":
      return `Play all ${format.games}`;
  }
}

function formatScoringSystemLabel(system: RulesetScoringSystem): string {
  switch (system.type) {
    case "match_points":
      return `Match points: win ${system.win}, loss ${system.loss}, draw ${system.draw ?? 0}`;
    case "game_points":
      return `Game points: win ${system.per_game_win}, loss ${system.per_game_loss}`;
    case "hybrid":
      return `Hybrid: match win ${system.match_win}, match loss ${system.match_loss}, game win ${system.game_win}, game loss ${system.game_loss}`;
  }
}

function formatStageType(type: RulesetStage["type"]): string {
  switch (type) {
    case "round_robin":
      return "Round robin";
    case "single_elimination":
      return "Single elimination";
    case "double_elimination":
      return "Double elimination";
  }
}

function formatParticipants(stage: RulesetStage): string {
  if (stage.participants.source === "division_players") {
    return "All players in the division";
  }

  const selector =
    stage.participants.selector.type === "top_n" &&
    stage.participants.selector.count
      ? `Top ${stage.participants.selector.count}`
      : stage.participants.selector.type;

  return `${selector} from stage "${stage.participants.stage_id}"`;
}

function formatCadence(config: RulesetConfig, stage: RulesetStage): string {
  const days =
    stage.cadence?.round_duration_days ?? config.calendar?.round_duration_days;

  if (!days) return "Not specified";
  if (days === 7) return "1 round per 7 days";
  if (days === 1) return "1 round per day";
  return `1 round per ${days} days`;
}

function formatMatchPolicy(stage: RulesetStage, config: RulesetConfig): string[] {
  const lines: string[] = [];
  const defaultFormat = config.match_formats[stage.match_format_policy.default_format];

  if (defaultFormat) {
    lines.push(`Default: ${formatMatchFormatLabel(defaultFormat)}`);
  } else {
    lines.push(`Default format id: ${stage.match_format_policy.default_format}`);
  }

  for (const override of stage.match_format_policy.overrides ?? []) {
    const overrideFormat = config.match_formats[override.format];
    const label = overrideFormat
      ? formatMatchFormatLabel(overrideFormat)
      : override.format;

    if (override.round_number) {
      lines.push(`Round ${override.round_number}: ${label}`);
    } else if (override.round) {
      lines.push(`${override.round}: ${label}`);
    }
  }

  return lines;
}

function StageSection({
  stage,
  config,
}: {
  stage: RulesetStage;
  config: RulesetConfig;
}) {
  const scoring =
    stage.type === "round_robin"
      ? config.scoring_systems[stage.scoring.system]
      : null;

  return (
    <Stack gap={6}>
      <Group gap="xs">
        <Text fw={700}>{stage.name}</Text>
        <Badge variant="light" color="gold">
          {formatStageType(stage.type)}
        </Badge>
      </Group>

      <Text size="sm">Stage id: {stage.id}</Text>
      <Text size="sm">Participants: {formatParticipants(stage)}</Text>
      <Text size="sm">Cadence: {formatCadence(config, stage)}</Text>

      {stage.type === "round_robin" && (
        <Text size="sm">Legs: {stage.round_robin.legs}</Text>
      )}

      {scoring && (
        <Text size="sm">Scoring: {formatScoringSystemLabel(scoring)}</Text>
      )}

      {stage.advancement && (
        <Text size="sm">
          Advancement: {stage.advancement.type}
          {stage.advancement.count ? ` (${stage.advancement.count})` : ""}
        </Text>
      )}

      {stage.seeding && (
        <Text size="sm">Seeding: {stage.seeding.type}</Text>
      )}

      {stage.tiebreakers && stage.tiebreakers.length > 0 && (
        <Text size="sm">Tiebreakers: {stage.tiebreakers.join(" → ")}</Text>
      )}

      <Stack gap={2}>
        <Text size="sm" fw={600}>
          Match formats
        </Text>
        <List
          size="sm"
          spacing={2}
          icon={
            <ThemeIcon size={18} radius="xl" color="gold" variant="light">
              <IconCheck size={12} />
            </ThemeIcon>
          }
        >
          {formatMatchPolicy(stage, config).map((line) => (
            <List.Item key={line}>{line}</List.Item>
          ))}
        </List>
      </Stack>
    </Stack>
  );
}

export function RulesetDetailsModal({
  opened,
  onClose,
  rulesetId,
}: RulesetDetailsModalProps) {
  const rulesetQuery = useQuery({
    queryKey: rulesetKeys.detail(rulesetId),
    queryFn: () => fetchRulesetById(rulesetId as number),
    enabled: opened && rulesetId != null,
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Ruleset details"
      centered
      size="lg"
    >
      {rulesetId == null ? (
        <Alert icon={<IconInfoCircle size={16} />} color="gray" variant="light">
          No ruleset selected.
        </Alert>
      ) : rulesetQuery.isPending ? (
        <Center py="xl">
          <Loader color="gold" />
        </Center>
      ) : rulesetQuery.isError ? (
        <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
          Failed to load ruleset details.
        </Alert>
      ) : rulesetQuery.data ? (
        <Stack gap="md">
          <div>
            <Text fw={700} size="lg">
              {rulesetQuery.data.name}
            </Text>
            <Text size="sm" c="dimmed">
              Version {rulesetQuery.data.config.version}
            </Text>
          </div>

          <Stack gap={4}>
            <Text fw={600}>Defined match formats</Text>
            {getMatchFormatEntries(rulesetQuery.data.config.match_formats).map(
              ([key, value]) => (
                <Text key={key} size="sm">
                  {key}: {formatMatchFormatLabel(value)}
                </Text>
              ),
            )}
          </Stack>

          <Stack gap={4}>
            <Text fw={600}>Defined scoring systems</Text>
            {getScoringSystemEntries(rulesetQuery.data.config.scoring_systems).map(
              ([key, value]) => (
                <Text key={key} size="sm">
                  {key}: {formatScoringSystemLabel(value)}
                </Text>
              ),
            )}
          </Stack>

          <Divider />

          <Stack gap="lg">
            {rulesetQuery.data.config.stages.map((stage, index) => (
              <Fragment key={stage.id}>
                <StageSection stage={stage} config={rulesetQuery.data.config} />
                {index < rulesetQuery.data.config.stages.length - 1 && <Divider />}
              </Fragment>
            ))}
          </Stack>
        </Stack>
      ) : null}
    </Modal>
  );
}