import { useEffect, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconExternalLink,
} from "@tabler/icons-react";

import { CollapsibleTile } from "../../../components/tournament-admin/shared";
import { useI18n } from "../../../i18n/I18nProvider";
import type { SignupPageState } from "./useSignupPageState";

function registrationStatusColor(status: string) {
  switch (status) {
    case "approved":
      return "green";
    case "rejected":
      return "red";
    case "withdrawn":
      return "gray";
    default:
      return "yellow";
  }
}

export function SelfRegistrationSection({
  state,
}: {
  state: SignupPageState;
}) {
  const { t } = useI18n();

  function registrationStatusLabel(status: string) {
    switch (status) {
      case "approved":
        return t("tournament.signup.status.approved");
      case "rejected":
        return t("tournament.signup.status.rejected");
      case "withdrawn":
        return t("tournament.signup.status.withdrawn");
      default:
        return t("tournament.signup.status.pending");
    }
  }

  function getFriendlyRegistrationError(error: unknown): string | null {
    if (!(error instanceof Error)) {
      return null;
    }

    const message = error.message?.trim();
    if (!message) {
      return t("tournament.signup.errors.saveFailed");
    }

    if (message.includes("Enter a valid AoE2Companion player URL")) {
      return t("tournament.signup.errors.invalidUrl");
    }

    if (message.includes("AoE2Companion profile was not found")) {
      return t("tournament.signup.errors.profileNotFound");
    }

    if (message.includes("Registrations are closed")) {
      return t("tournament.signup.errors.registrationsClosed");
    }

    if (message.includes("already registered")) {
      return t("tournament.signup.errors.alreadyRegistered");
    }

    return message;
  }

  const {
    tournament,
    selfRegistration,
    selfRegistrationQuery,
    selfSectionTitle,
    isCreateMode,
    isEditableForm,
    selfCapabilities,
    aoeUrl,
    setAoeUrl,
    note,
    setNote,
    canReRegister,
    isReRegistering,
    setIsReRegistering,
    saveMyRegistrationMutation,
    withdrawMutation,
    selfFeedback
  } = state;

  const registrationsClosed =
    tournament.status === "signup" && (tournament.registrations_open ?? 0) !== 1;

  const profileUrl = selfRegistration
    ? `https://www.aoe2companion.com/players/${selfRegistration.aoe_id}`
    : null;

  const mutationError = getFriendlyRegistrationError(saveMyRegistrationMutation.error);
  const [displayError, setDisplayError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayError(mutationError);
  }, [mutationError]);

  const urlError =
    displayError === t("tournament.signup.errors.invalidUrl") ||
    displayError === t("tournament.signup.errors.profileNotFound")
      ? displayError
      : undefined;

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

  return (
    <CollapsibleTile
      title={selfSectionTitle}
      subtitle={
        selfRegistration && !isCreateMode
          ? t("tournament.signup.self.subtitle.edit")
          : t("tournament.signup.self.subtitle.create")
      }
      defaultOpen
    >
      <Stack gap="md">
        {selfRegistrationQuery.isPending ? (
          <Loader size="sm" />
        ) : (
          <>
            {selfFeedback ? (
              <Alert color="green" variant="light">
                {selfFeedback}
              </Alert>
            ) : null}

            {displayError && !urlError ? (
              <Alert icon={<IconAlertTriangle size={20} />} color="red" variant="light">
                {displayError}
              </Alert>
            ) : null}

            {!isCreateMode && selfRegistration ? (
              <Stack gap="xs">
                {registrationsClosed ? (
                  <Alert icon={<IconAlertTriangle size={20} />} color="yellow" variant="light">
                    {t("tournament.signup.self.closedEdit")}
                  </Alert>
                ) : null}

                <Group gap="xs" align="center">
                  <Text size="sm" fw={600}>
                    {t("common.currentStatus")}:
                  </Text>
                  <Badge color={registrationStatusColor(selfRegistration.status)} variant="light">
                    {registrationStatusLabel(selfRegistration.status)}
                  </Badge>
                </Group>

                <Group gap="xs" wrap="wrap">
                  <Text size="sm" c="dimmed">
                    {t("tournament.signup.self.aoeProfile")}
                  </Text>

                  <Text size="sm">{selfRegistration.aoe_name}</Text>

                  <Text size="sm" c="dimmed">
                    –
                  </Text>

                  {profileUrl ? (
                    <Anchor
                      href={profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      AoE2Companion
                      <IconExternalLink size={14} />
                    </Anchor>
                  ) : null}
                </Group>

                {selfRegistration.status === "approved" ? (
                  <Alert icon={<IconCheck size={20} />} color="green" variant="light">
                    {t("tournament.signup.self.statusMessage.approved")}
                  </Alert>
                ) : null}

                {selfRegistration.status === "rejected" ? (
                  <Alert icon={<IconX size={20} />} color="red" variant="light">
                    {t("tournament.signup.self.statusMessage.rejected")}
                  </Alert>
                ) : null}

                {selfRegistration.status === "withdrawn" ? (
                  <Alert color="gray" variant="light">
                    {t("tournament.signup.self.statusMessage.withdrawn")}
                  </Alert>
                ) : null}
              </Stack>
            ) : null}

            {isCreateMode ? (
              <>
                <TextInput
                  label={t("tournament.signup.fields.url.label")}
                  placeholder={t("tournament.signup.fields.url.placeholder")}
                  value={aoeUrl}
                  onChange={(event) => handleUrlChange(event.currentTarget.value)}
                  disabled={!isEditableForm}
                  error={urlError}
                />

                <Textarea
                  label={t("common.note")}
                  placeholder={t("tournament.signup.fields.note.placeholder")}
                  value={note}
                  onChange={(event) => handleNoteChange(event.currentTarget.value)}
                  minRows={4}
                  autosize
                  disabled={!isEditableForm}
                />

                <Group justify="flex-end">
                  {isEditableForm ? (
                    <Button
                      color="gold"
                      loading={saveMyRegistrationMutation.isPending}
                      onClick={() => saveMyRegistrationMutation.mutate()}
                    >
                      {t("tournament.signup.actions.signup")}
                    </Button>
                  ) : null}
                </Group>
              </>
            ) : null}

            {!isCreateMode && selfRegistration ? (
              <>
                <TextInput
                  label={t("tournament.signup.fields.url.label")}
                  placeholder={t("tournament.signup.fields.url.placeholder")}
                  value={aoeUrl}
                  onChange={(event) => handleUrlChange(event.currentTarget.value)}
                  disabled={!isEditableForm || registrationsClosed}
                  error={urlError}
                />

                <Textarea
                  label={t("common.note")}
                  placeholder={t("tournament.signup.fields.note.placeholder")}
                  value={note}
                  onChange={(event) => handleNoteChange(event.currentTarget.value)}
                  minRows={4}
                  autosize
                  disabled={!isEditableForm || registrationsClosed}
                />

                <Group justify="flex-end">
                  {canReRegister && !isReRegistering && !registrationsClosed ? (
                    <Button
                      color="gold"
                      onClick={() => {
                        setIsReRegistering(true);
                        setDisplayError(null);
                      }}
                    >
                      {t("tournament.signup.actions.registerAgain")}
                    </Button>
                  ) : null}

                  {selfCapabilities.can_withdraw && !registrationsClosed ? (
                    <Button
                      color="red"
                      variant="light"
                      loading={withdrawMutation.isPending}
                      onClick={() => withdrawMutation.mutate()}
                    >
                      {t("tournament.signup.actions.withdraw")}
                    </Button>
                  ) : null}

                  {isEditableForm && !registrationsClosed ? (
                    <Button
                      color="gold"
                      loading={saveMyRegistrationMutation.isPending}
                      onClick={() => saveMyRegistrationMutation.mutate()}
                    >
                      {t("tournament.signup.actions.saveChanges")}
                    </Button>
                  ) : null}

                  {isReRegistering && !registrationsClosed ? (
                    <Button
                      variant="subtle"
                      onClick={() => {
                        setIsReRegistering(false);
                        setDisplayError(null);
                        setNote(selfRegistration.note ?? "");
                        setAoeUrl(
                          `https://www.aoe2companion.com/players/${selfRegistration.aoe_id}`,
                        );
                      }}
                    >
                      {t("common.cancel")}
                    </Button>
                  ) : null}
                </Group>
              </>
            ) : null}
          </>
        )}
      </Stack>
    </CollapsibleTile>
  );
}