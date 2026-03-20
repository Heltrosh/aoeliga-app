import { useMemo, useState } from "react";
import { Button, Divider, Group, Stack, Text, TextInput, Textarea } from "@mantine/core";

import { CollapsibleTile, SelectedUserInfo, UserPicker } from "../../../components/tournament-admin/shared";
import type { UserListItem } from "../../../api/users";
import type { SignupPageState } from "./useSignupPageState";

export function AdminRegistrationSection({
  state,
}: {
  state: SignupPageState;
}) {
  const {
    users,
    registrations,
    usersQuery,
    saveAdminRegistrationMutation,
  } = state;

  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [aoeUrl, setAoeUrl] = useState("");
  const [note, setNote] = useState("");

  const availableUsers = useMemo(() => {
    const registeredUserIds = new Set(registrations.map((registration) => registration.user_id));
    return users.filter((user) => !registeredUserIds.has(user.id));
  }, [registrations, users]);

  return (
    <CollapsibleTile
      title="Register player"
      subtitle="Register a player on their behalf."
      defaultOpen
    >
      <Stack gap="md">
        <UserPicker
          label="Select user"
          users={availableUsers}
          value={selectedUser}
          onChange={setSelectedUser}
          disabled={usersQuery.isPending || saveAdminRegistrationMutation.isPending}
        />

        <Divider />

        <div>
          <Text fw={600} mb={4}>
            Selected user
          </Text>
          <SelectedUserInfo user={selectedUser} emptyText="No user selected" />
        </div>

        <TextInput
          label="AoE2Companion profile URL"
          placeholder="https://www.aoe2companion.com/players/2047125"
          value={aoeUrl}
          onChange={(event) => setAoeUrl(event.currentTarget.value)}
          disabled={!selectedUser || saveAdminRegistrationMutation.isPending}
        />

        <Textarea
          label="Note"
          placeholder="Optional note for tournament staff"
          value={note}
          onChange={(event) => setNote(event.currentTarget.value)}
          minRows={4}
          autosize
          disabled={!selectedUser || saveAdminRegistrationMutation.isPending}
        />

        <Group justify="flex-end">
          <Button
            color="gold"
            disabled={!selectedUser || !aoeUrl.trim()}
            loading={saveAdminRegistrationMutation.isPending}
            onClick={() => {
              if (!selectedUser) {
                return;
              }

              saveAdminRegistrationMutation.mutate(
                {
                  user_id: selectedUser.id,
                  aoe2companion_url: aoeUrl.trim(),
                  note: note.trim() || null,
                },
                {
                  onSuccess: () => {
                    setSelectedUser(null);
                    setAoeUrl("");
                    setNote("");
                  },
                },
              );
            }}
          >
            Register player
          </Button>
        </Group>
      </Stack>
    </CollapsibleTile>
  );
}