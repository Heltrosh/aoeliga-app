import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Divider,
  Group,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

import {
  CollapsibleTile,
  SelectedUserInfo,
  UserPicker,
} from "../../../components/tournament-admin/shared";
import type { UserListItem } from "../../../api/users";
import { useI18n } from "../../../i18n/I18nProvider";
import type { SignupPageState } from "./useSignupPageState";

export function AdminRegistrationSection({
  state,
}: {
  state: SignupPageState;
}) {
  const { t } = useI18n();

  function getFriendlyRegistrationError(error: unknown): string | null {
    if (!(error instanceof Error)) {
      return null;
    }

    const message = error.message?.trim();
    if (!message) {
      return t("tournament.signup.errors.createFailed");
    }

    if (message.includes("Enter a valid AoE2Companion player URL")) {
      return t("tournament.signup.errors.invalidUrl");
    }

    if (message.includes("AoE2Companion profile was not found")) {
      return t("tournament.signup.errors.profileNotFound");
    }

    if (message.includes("already registered")) {
      return t("tournament.signup.errors.alreadyRegistered");
    }

    return message;
  }

  const {
    users,
    registrations,
    usersQuery,
    saveAdminRegistrationMutation,
    adminRegistrationFeedback,
  } = state;

  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [aoeUrl, setAoeUrl] = useState("");
  const [note, setNote] = useState("");

  const mutationError = getFriendlyRegistrationError(saveAdminRegistrationMutation.error);
  const [displayError, setDisplayError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayError(mutationError);
  }, [mutationError]);

  const urlError =
    displayError === t("tournament.signup.errors.invalidUrl") ||
    displayError === t("tournament.signup.errors.profileNotFound")
      ? displayError
      : undefined;

  const availableUsers = useMemo(() => {
    const registeredUserIds = new Set(registrations.map((registration) => registration.user_id));
    return users.filter((user) => !registeredUserIds.has(user.id));
  }, [registrations, users]);

  const handleUserChange = (value: UserListItem | null) => {
    setSelectedUser(value);
    if (displayError) {
      setDisplayError(null);
    }
  };

  const handleUrlChange = (value: string) => {
    setAoeUrl(value);
    if (displayError) {
      setDisplayError(null);
    }
  };

  const handleNoteChange = (value: string) => {
    setNote(value);
    if (displayError && !urlError) {
      setDisplayError(null);
    }
  };

  const title = t("tournament.signup.admin.title");

  return (
    <CollapsibleTile
      title={title}
      subtitle={t("tournament.signup.admin.subtitle")}
      defaultOpen
    >
      <Stack gap="md">
        {adminRegistrationFeedback ? (
          <Alert color="green" variant="light">
            {adminRegistrationFeedback}
          </Alert>
        ) : null}

        {displayError && !urlError ? (
          <Alert icon={<IconAlertTriangle size={18} />} color="red" variant="light">
            {displayError}
          </Alert>
        ) : null}

        <UserPicker
          label={t("userpicker.selectUser")}
          users={availableUsers}
          value={selectedUser}
          onChange={handleUserChange}
          disabled={usersQuery.isPending || saveAdminRegistrationMutation.isPending}
        />

        <Divider />

        <div>
          <Text fw={600} mb={4}>
            {t("userpicker.selected")}
          </Text>
          <SelectedUserInfo
            user={selectedUser}
            emptyText={t("userpicker.noselected")}
          />
        </div>

        <TextInput
          label={t("tournament.signup.fields.url.label")}
          placeholder={t("tournament.signup.fields.url.placeholder")}
          value={aoeUrl}
          onChange={(event) => handleUrlChange(event.currentTarget.value)}
          disabled={!selectedUser || saveAdminRegistrationMutation.isPending}
          error={urlError}
        />

        <Textarea
          label={t("common.note")}
          placeholder={t("tournament.signup.fields.note.placeholder")}
          value={note}
          onChange={(event) => handleNoteChange(event.currentTarget.value)}
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
                    setDisplayError(null);
                    setSelectedUser(null);
                    setAoeUrl("");
                    setNote("");
                  },
                },
              );
            }}
          >
            {t("tournament.signup.admin.registerPlayer")}
          </Button>
        </Group>
      </Stack>
    </CollapsibleTile>
  );
}