import { Fragment } from "react";
import {
  Alert,
  Badge,
  Center,
  Divider,
  Group,
  List,
  Loader,
  Modal,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconCheck, IconInfoCircle, IconTrophy } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";

import { fetchRulesetById } from "../../api/rulesets";
import { rulesetKeys } from "../../api/queryKeys";
import type { RulesetConfig, RulesetStage } from "../../api/schemas/rulesets";
import {
  formatAdvancement,
  formatCadence,
  formatMatchPolicy,
  formatParticipants,
  formatRoundRobinDetails,
  formatScoringSystemLabel,
  formatSeeding,
  formatStageType,
  formatTiebreakerLabel,
  getPrimaryStageFormatsSummary,
  getTournamentStructureSummary,
} from "./rulesetDetailsHelpers";
import { AppSurface } from "../common/AppSurface";

type RulesetDetailsModalProps = {
  opened: boolean;
  onClose: () => void;
  rulesetId: number | null;
};

function OverviewCard({ config }: { config: RulesetConfig }) {

  return (
    <AppSurface p="md">
        <div>
          <Text fw={700} size="sm" tt="uppercase" c="dimmed">
            Overview
          </Text>
          <Text size="sm" mt={6}>
            {getTournamentStructureSummary(config)}
          </Text>
          <Text size="sm" c="dimmed" mt={4}>
            {getPrimaryStageFormatsSummary(config)}
          </Text>
        </div>
    </AppSurface>
  );
}

function StageInfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <Group align="flex-start" gap="xs" wrap="nowrap">
      <Text size="sm" fw={600} w={110}>
        {label}
      </Text>
      <Text size="sm" c="dimmed" style={{ flex: 1 }}>
        {value}
      </Text>
    </Group>
  );
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

  const matchPolicy = formatMatchPolicy(stage, config);
  const roundRobinDetails = formatRoundRobinDetails(stage);
  const advancement = formatAdvancement(stage, config);
  const seeding = formatSeeding(stage, config);
  const cadence = formatCadence(config, stage);
  const participants = formatParticipants(stage, config);

  return (
    <AppSurface p="md">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap="xs">
              <Text fw={700} size="lg">
                {stage.name}
              </Text>
              <Badge variant="light" color="gold">
                {formatStageType(stage.type)}
              </Badge>
            </Group>
          </div>
        </Group>

        <Stack gap={8}>
          <StageInfoRow label="Participants" value={participants} />
          <StageInfoRow label="Format" value={roundRobinDetails} />
          <StageInfoRow label="Scoring" value={scoring ? formatScoringSystemLabel(scoring) : null} />
          <StageInfoRow label="Advancement" value={advancement} />
          <StageInfoRow label="Seeding" value={seeding} />
          <StageInfoRow label="Schedule" value={cadence} />
        </Stack>

        <Divider />

        <Stack gap={8}>
          <Text fw={600} size="sm">
            Match Format
          </Text>

          <List
            size="sm"
            spacing={4}
            icon={
              <ThemeIcon size={18} radius="xl" color="gold" variant="light">
                <IconCheck size={12} />
              </ThemeIcon>
            }
          >
            {matchPolicy.map((item) => (
              <List.Item key={`${item.label}-${item.value}`}>
                <Text span fw={600}>
                  {item.label}:
                </Text>{" "}
                {item.value}
              </List.Item>
            ))}
          </List>
        </Stack>

        {stage.tiebreakers && stage.tiebreakers.length > 0 ? (
          <>
            <Divider />
            <Stack gap={8}>
              <Text fw={600} size="sm">
                Tiebreakers
              </Text>

              <List
                size="sm"
                spacing={4}
                withPadding
                icon={
                  <ThemeIcon size={18} radius="xl" color="gray" variant="light">
                    <IconTrophy size={12} />
                  </ThemeIcon>
                }
              >
                {stage.tiebreakers.map((tiebreaker) => (
                  <List.Item key={tiebreaker}>
                    {formatTiebreakerLabel(tiebreaker)}
                  </List.Item>
                ))}
              </List>
            </Stack>
          </>
        ) : null}
      </Stack>
    </AppSurface>
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
      size="xl"
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
        <Stack gap="lg">
          <div>
            <Text fw={700} size="xl">
              {rulesetQuery.data.name}
            </Text>
            <Text size="sm" c="dimmed">
              Version {rulesetQuery.data.config.version}
            </Text>
          </div>

          <OverviewCard config={rulesetQuery.data.config} />

          <Stack gap="lg">
            {rulesetQuery.data.config.stages.map((stage) => (
              <Fragment key={stage.id}>
                <StageSection stage={stage} config={rulesetQuery.data.config} />
              </Fragment>
            ))}
          </Stack>
        </Stack>
      ) : null}
    </Modal>
  );
}