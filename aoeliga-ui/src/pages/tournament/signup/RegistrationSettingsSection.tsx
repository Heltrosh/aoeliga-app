import {
  Alert,
  Badge,
  Button,
  Group,
  NumberInput,
  Stack,
  Text,
} from "@mantine/core";

import { CollapsibleTile } from "../../../components/tournament-admin/shared";
import { useI18n } from "../../../i18n/I18nProvider";
import type { SignupPageState } from "./useSignupPageState";

export function RegistrationSettingsSection({
  state,
}: {
  state: SignupPageState;
}) {
  const { t } = useI18n();

  const {
    tournament,
    settingsOpenValue,
    setSettingsOpenValue,
    settingsRecentDays,
    setSettingsRecentDays,
    settingsMutation,
    settingsFeedback,
  } = state;

  const currentOpen = tournament.registrations_open === 1;
  const pendingChanged = settingsOpenValue !== currentOpen;

  const title = t("tournament.signup.settings.title");

  return (
    <CollapsibleTile
      title={title}
      subtitle={t("tournament.signup.settings.subtitle")}
      defaultOpen
    >
      <Stack gap="md">
        {settingsFeedback ? (
          <Alert color="green" variant="light">
            {settingsFeedback}
          </Alert>
        ) : null}

        <Stack gap="xs">
          <Group gap="xs">
            <Text fw={600}>{t("common.currentStatus")}:</Text>
            <Badge color={currentOpen ? "green" : "gray"} variant="light">
              {currentOpen
                ? t("tournament.signup.settings.status.open")
                : t("tournament.signup.settings.status.closed")}
            </Badge>
          </Group>

          <Text size="sm" c="dimmed">
            {t("tournament.signup.settings.chooseState")}
          </Text>
        </Stack>

        <NumberInput
          label={t("tournament.signup.settings.recentGamesDays")}
          min={1}
          value={settingsRecentDays ?? undefined}
          onChange={(value) =>
            setSettingsRecentDays(typeof value === "number" ? value : null)
          }
        />

        <Group>
          <Button
            color={settingsOpenValue ? "green" : "gray"}
            variant={settingsOpenValue ? "filled" : "light"}
            onClick={() => setSettingsOpenValue(true)}
          >
            {t("tournament.signup.settings.openRegistrations")}
          </Button>

          <Button
            color={!settingsOpenValue ? "red" : "gray"}
            variant={!settingsOpenValue ? "filled" : "light"}
            onClick={() => setSettingsOpenValue(false)}
          >
            {t("tournament.signup.settings.closeRegistrations")}
          </Button>
        </Group>

        <Text size="sm" c="dimmed">
          {t("tournament.signup.settings.selectedState", {
            state: settingsOpenValue
              ? t("tournament.signup.settings.status.open")
              : t("tournament.signup.settings.status.closed"),
          })}
          {pendingChanged
            ? ` ${t("tournament.signup.settings.unsavedChange")}`
            : ""}
          {tournament.recent_games_days
            ? ` ${t("tournament.signup.settings.currentWindow", {
                days: tournament.recent_games_days,
              })}`
            : ""}
        </Text>

        <Group justify="flex-end">
          <Button
            color="gold"
            loading={settingsMutation.isPending}
            onClick={() => settingsMutation.mutate()}
          >
            {t("tournament.signup.settings.save")}
          </Button>
        </Group>
      </Stack>
    </CollapsibleTile>
  );
}