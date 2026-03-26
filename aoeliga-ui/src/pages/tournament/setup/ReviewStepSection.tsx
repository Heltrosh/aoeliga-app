import { Alert, Badge, Button, Group, List, Stack, Text } from "@mantine/core";
import { IconAlertCircle, IconCheck, IconPlayerPlay } from "@tabler/icons-react";
import type { UseMutationResult } from "@tanstack/react-query";

import { AppSurface } from "../../../components/common/AppSurface";
import { useI18n } from "../../../i18n/I18nProvider";
import type { TournamentSetup } from "../../../api/schemas/tournamentSetup";

type ReviewStepSectionProps = {
  setup: TournamentSetup;
  mutation: UseMutationResult<TournamentSetup, Error, void, unknown>;
};

export function ReviewStepSection({ setup, mutation }: ReviewStepSectionProps) {
  const { t } = useI18n();

  const divisionsReady = setup.divisions.length > 0;
  const playersReady =
    setup.assignments.length === setup.eligible_registrations.length &&
    setup.eligible_registrations.length > 0;
  const matchesReady = setup.matches.length > 0;
  const canApply = divisionsReady && playersReady && matchesReady;

  async function handleApply() {
    const confirmed = window.confirm(t("tournament.setup.apply.confirm"));
    if (!confirmed) return;
    await mutation.mutateAsync();
  }

  return (
    <AppSurface p="xl">
      <Stack gap="lg">
        <div>
          <Text fw={700} size="lg">
            {t("tournament.setup.review.title")}
          </Text>
          <Text c="dimmed" size="sm">
            {t("tournament.setup.review.description")}
          </Text>
        </div>

        <Group gap="xs">
          <Badge color={divisionsReady ? "green" : "gray"} variant="light">
            {t("tournament.setup.review.divisions", { count: setup.divisions.length })}
          </Badge>
          <Badge color={playersReady ? "green" : "gray"} variant="light">
            {t("tournament.setup.review.players", { count: setup.assignments.length })}
          </Badge>
          <Badge color={matchesReady ? "green" : "gray"} variant="light">
            {t("tournament.setup.review.matches", { count: setup.matches.length })}
          </Badge>
        </Group>

        {!canApply ? (
          <Alert color="yellow" variant="light" icon={<IconAlertCircle size={18} />}>
            {t("tournament.setup.review.notReady")}
          </Alert>
        ) : null}

        {mutation.isError ? (
          <Alert color="red" variant="light" icon={<IconAlertCircle size={18} />}>
            {mutation.error?.message ?? t("tournament.setup.errors.saveFailed")}
          </Alert>
        ) : null}

        <List spacing="xs" icon={<IconCheck size={16} />}>
          <List.Item>{t("tournament.setup.review.summaryDivisions")}</List.Item>
          <List.Item>{t("tournament.setup.review.summaryPlayers")}</List.Item>
          <List.Item>{t("tournament.setup.review.summaryMatches")}</List.Item>
          <List.Item>{t("tournament.setup.review.summaryActivation")}</List.Item>
        </List>

        <Group justify="flex-end">
          <Button
            leftSection={<IconPlayerPlay size={16} />}
            loading={mutation.isPending}
            onClick={handleApply}
            disabled={!canApply}
          >
            {t("tournament.setup.actions.apply")}
          </Button>
        </Group>
      </Stack>
    </AppSurface>
  );
}
