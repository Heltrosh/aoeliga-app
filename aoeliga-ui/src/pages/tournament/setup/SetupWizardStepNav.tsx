import { Badge, Group, SegmentedControl, Stack, Text } from "@mantine/core";

import { AppSurface } from "../../../components/common/AppSurface";
import { useI18n } from "../../../i18n/I18nProvider";
import type { TournamentSetup } from "../../../api/schemas/tournamentSetup";
import type { SetupStepValue } from "./helpers";

type SetupWizardStepNavProps = {
  setup: TournamentSetup;
  value: SetupStepValue;
  onChange: (value: SetupStepValue) => void;
};

export function SetupWizardStepNav({
  setup,
  value,
  onChange,
}: SetupWizardStepNavProps) {
  const { t } = useI18n();

  const divisionsReady = setup.divisions.length > 0;
  const assignmentsReady = setup.assignments.length === setup.eligible_registrations.length && setup.eligible_registrations.length > 0;
  const matchesReady = setup.matches.length > 0;

  const data = [
    { label: t("tournament.setup.steps.divisions"), value: "divisions" },
    { label: t("tournament.setup.steps.players"), value: "players" },
    { label: t("tournament.setup.steps.matches"), value: "matches" },
    { label: t("tournament.setup.steps.review"), value: "review" },
  ];

  return (
    <AppSurface p="md">
      <Stack gap="md">
        <SegmentedControl
          fullWidth
          value={value}
          onChange={(next) => onChange(next as SetupStepValue)}
          data={data}
        />

        <Group gap="xs">
          <Badge color={divisionsReady ? "green" : "gray"} variant="light">
            {t("tournament.setup.status.divisions", {
              status: divisionsReady
                ? t("tournament.setup.status.ready")
                : t("tournament.setup.status.pending"),
            })}
          </Badge>
          <Badge color={assignmentsReady ? "green" : "gray"} variant="light">
            {t("tournament.setup.status.players", {
              status: assignmentsReady
                ? t("tournament.setup.status.ready")
                : t("tournament.setup.status.pending"),
            })}
          </Badge>
          <Badge color={matchesReady ? "green" : "gray"} variant="light">
            {t("tournament.setup.status.matches", {
              status: matchesReady
                ? t("tournament.setup.status.ready")
                : t("tournament.setup.status.pending"),
            })}
          </Badge>
        </Group>

        <Text size="sm" c="dimmed">
          {t("tournament.setup.stepDescription")}
        </Text>
      </Stack>
    </AppSurface>
  );
}
