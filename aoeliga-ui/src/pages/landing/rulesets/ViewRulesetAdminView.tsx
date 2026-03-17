import { Fragment } from "react";
import {
  Badge,
  Box,
  Divider,
  Grid,
  Group,
  List,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconCheck,
  IconTournament,
  IconTrophy,
  IconUsersGroup,
} from "@tabler/icons-react";

import type { RulesetConfig, RulesetDetail, RulesetStage } from "../../../api/schemas/rulesets";
import {
  formatAdvancement,
  formatCadence,
  formatMatchFormatLabel,
  formatMatchPolicy,
  formatParticipants,
  formatRoundRobinDetails,
  formatScoringSystemLabel,
  formatSeeding,
  formatStageType,
  formatTiebreakerLabel,
  getMatchFormatEntries,
  getPrimaryStageFormatsSummary,
  getScoringSystemEntries,
  getTournamentStructureSummary,
} from "../../../components/rulesets/rulesetDetailsHelpers";
import { AppSurface } from "../../../components/common/AppSurface";

function OverviewCard({ config }: { config: RulesetConfig }) {
  const matchFormats = getMatchFormatEntries(config.match_formats);
  const scoringSystems = getScoringSystemEntries(config.scoring_systems);
  const defaultCadence = config.calendar?.round_duration_days;

  return (
    <AppSurface p="md">
      <Stack gap="md">
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

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap={6}>
              <Text fw={600} size="sm">
                Available Match Formats
              </Text>

              {matchFormats.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No match formats defined.
                </Text>
              ) : (
                matchFormats.map(([key, value]) => (
                  <Group key={key} gap={8} wrap="nowrap">
                    <Badge variant="light" color="gray" size="sm">
                      {key.toUpperCase()}
                    </Badge>
                    <Text size="sm">{formatMatchFormatLabel(value)}</Text>
                  </Group>
                ))
              )}
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap={6}>
              <Text fw={600} size="sm">
                Scoring Systems
              </Text>

              {scoringSystems.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No scoring systems defined.
                </Text>
              ) : (
                scoringSystems.map(([key, value]) => (
                  <Group key={key} gap={8} wrap="nowrap" align="flex-start">
                    <Badge variant="light" color="gray" size="sm">
                      {key}
                    </Badge>
                    <Text size="sm">{formatScoringSystemLabel(value)}</Text>
                  </Group>
                ))
              )}

              <Text size="sm" mt={6}>
                <Text span fw={600}>
                  Default round duration:
                </Text>{" "}
                {defaultCadence ? `1 round every ${defaultCadence} days` : "Not specified"}
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
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
          <StageInfoRow
            label="Scoring"
            value={scoring ? formatScoringSystemLabel(scoring) : null}
          />
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

function UsageCard({
  ruleset,
}: {
  ruleset: RulesetDetail;
}) {
  const tournamentDefaults = ruleset.usage.tournament_defaults ?? [];
  const divisions = ruleset.usage.divisions ?? [];

  return (
    <AppSurface p="md">
      <Stack gap="md">
        <Text fw={700} size="sm" tt="uppercase" c="dimmed">
          Usage
        </Text>

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xs">
              <Group gap="xs">
                <ThemeIcon variant="light" color="blue">
                  <IconTournament size={16} />
                </ThemeIcon>
                <Text fw={600} size="sm">
                  Tournament defaults
                </Text>
              </Group>

              {tournamentDefaults.length === 0 ? (
                <Text size="sm" c="dimmed">
                  Not used as a tournament default.
                </Text>
              ) : (
                <List size="sm" spacing={4}>
                  {tournamentDefaults.map((tournament) => (
                    <List.Item key={tournament.id}>
                      {tournament.name}{" "}
                      <Text span c="dimmed">
                        ({tournament.slug})
                      </Text>
                    </List.Item>
                  ))}
                </List>
              )}
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xs">
              <Group gap="xs">
                <ThemeIcon variant="light" color="teal">
                  <IconUsersGroup size={16} />
                </ThemeIcon>
                <Text fw={600} size="sm">
                  Division assignments
                </Text>
              </Group>

              {divisions.length === 0 ? (
                <Text size="sm" c="dimmed">
                  Not assigned to any division.
                </Text>
              ) : (
                <List size="sm" spacing={4}>
                  {divisions.map((division) => (
                    <List.Item key={division.id}>
                      {division.tournament_name} — {division.name}{" "}
                      <Text span c="dimmed">
                        ({division.tournament_slug})
                      </Text>
                    </List.Item>
                  ))}
                </List>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </AppSurface>
  );
}

export function AdminRulesetDetailsView({
  ruleset,
}: {
  ruleset: RulesetDetail;
}) {
  return (
    <Stack gap="lg">
      <Box>
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={3}>{ruleset.name}</Title>
            <Text size="sm" c="dimmed">
              Version {ruleset.config.version}
            </Text>
          </div>

          <Badge
            variant="light"
            color={ruleset.usage.is_in_use ? "blue" : "gray"}
          >
            {ruleset.usage.is_in_use ? "In use" : "Unused"}
          </Badge>
        </Group>

        <Text size="sm" c="dimmed" mt={8}>
          Owner:{" "}
          {ruleset.creator_display_name ||
            ruleset.creator_discord_name ||
            "Unknown"}
        </Text>
      </Box>

      <OverviewCard config={ruleset.config} />
      <UsageCard ruleset={ruleset} />

      <Stack gap="lg">
        {ruleset.config.stages.map((stage) => (
          <Fragment key={stage.id}>
            <StageSection stage={stage} config={ruleset.config} />
          </Fragment>
        ))}
      </Stack>
    </Stack>
  );
}