import { Badge, Button, Group, NumberInput, Stack, Text } from "@mantine/core";

import { CollapsibleTile } from "../../../components/tournament-admin/shared";
import type { SignupPageState } from "./useSignupPageState";

export function RegistrationSettingsSection({
  state,
}: {
  state: SignupPageState;
}) {
  const {
    tournament,
    settingsOpenValue,
    setSettingsOpenValue,
    settingsRecentDays,
    setSettingsRecentDays,
    settingsMutation,
  } = state;

  const currentOpen = tournament.registrations_open === 1;
  const pendingChanged = settingsOpenValue !== currentOpen;

  return (
    <CollapsibleTile
      title="Registration settings"
      subtitle="Configure tournament signup availability and requirements."
      defaultOpen
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Group gap="xs">
            <Text fw={600}>Current status:</Text>
            <Badge color={currentOpen ? "green" : "gray"} variant="light">
              {currentOpen ? "Open" : "Closed"}
            </Badge>
          </Group>

          <Text size="sm" c="dimmed">
            Choose the desired state below, then save it.
          </Text>
        </Stack>

        <NumberInput
          label="Recent games days"
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
            Open registrations
          </Button>

          <Button
            color={!settingsOpenValue ? "red" : "gray"}
            variant={!settingsOpenValue ? "filled" : "light"}
            onClick={() => setSettingsOpenValue(false)}
          >
            Close registrations
          </Button>
        </Group>

        <Text size="sm" c="dimmed">
          Selected state: <b>{settingsOpenValue ? "Open" : "Closed"}</b>
          {pendingChanged ? " (unsaved change)" : ""}
          {tournament.recent_games_days
            ? ` • current recent games window ${tournament.recent_games_days} days`
            : ""}
        </Text>

        <Group justify="flex-end">
          <Button
            color="gold"
            loading={settingsMutation.isPending}
            onClick={() => settingsMutation.mutate()}
          >
            Save settings
          </Button>
        </Group>
      </Stack>
    </CollapsibleTile>
  );
}