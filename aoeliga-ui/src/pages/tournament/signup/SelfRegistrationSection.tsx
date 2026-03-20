import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";

import { CollapsibleTile } from "../../../components/tournament-admin/shared";
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
  const {
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
    canSelfRegister,
    isSignupStage,
  } = state;

  const selfInteractionLocked = !canSelfRegister;

  const lockedMessage = isSignupStage
    ? "Self-registration is unavailable because registrations are closed."
    : "Self-registration is unavailable because the tournament is not in signup stage.";

  return (
    <CollapsibleTile
      title={selfSectionTitle}
      subtitle={
        selfRegistration && !isCreateMode
          ? "View and manage your current tournament registration."
          : "Submit your registration for this tournament."
      }
      defaultOpen
    >
      <Stack gap="md">
        {selfRegistrationQuery.isPending ? (
          <Loader size="sm" />
        ) : (
          <>
            <Group justify="space-between" align="center">
              <div />
              {selfRegistration ? (
                <Badge color={registrationStatusColor(selfRegistration.status)} variant="light">
                  {selfRegistration.status}
                </Badge>
              ) : null}
            </Group>

            {selfInteractionLocked ? (
              <Alert color="yellow" variant="light">
                {lockedMessage}
              </Alert>
            ) : null}

            {selfRegistration ? (
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  AoE profile: {selfRegistration.aoe_name} ({selfRegistration.aoe_id})
                </Text>

                {selfRegistration.status === "rejected" ? (
                  <Alert color="red" variant="light">
                    Your registration was rejected.
                  </Alert>
                ) : null}

                {selfRegistration.status === "withdrawn" ? (
                  <Alert color="gray" variant="light">
                    You have withdrawn your registration.
                  </Alert>
                ) : null}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">
                Submit your AoE2Companion profile and optional note.
              </Text>
            )}

            {selfInteractionLocked && !selfRegistration ? null : (
              <>
                <TextInput
                  label="AoE2Companion profile URL"
                  placeholder="https://www.aoe2companion.com/players/2047125"
                  value={aoeUrl}
                  onChange={(event) => setAoeUrl(event.currentTarget.value)}
                  disabled={!isEditableForm || selfInteractionLocked}
                />

                <Textarea
                  label="Note"
                  placeholder="Optional note for tournament staff"
                  value={note}
                  onChange={(event) => setNote(event.currentTarget.value)}
                  minRows={4}
                  autosize
                  disabled={!isEditableForm || selfInteractionLocked}
                />
              </>
            )}

            <Group justify="flex-end">
              {canReRegister && !isReRegistering && !selfInteractionLocked ? (
                <Button
                  color="gold"
                  onClick={() => {
                    setIsReRegistering(true);
                  }}
                >
                  Register again
                </Button>
              ) : null}

              {selfCapabilities.can_withdraw && !isCreateMode && !selfInteractionLocked ? (
                <Button
                  color="red"
                  variant="light"
                  loading={withdrawMutation.isPending}
                  onClick={() => withdrawMutation.mutate()}
                >
                  Withdraw
                </Button>
              ) : null}

              {isEditableForm && !selfInteractionLocked ? (
                <Button
                  color="gold"
                  loading={saveMyRegistrationMutation.isPending}
                  onClick={() => saveMyRegistrationMutation.mutate()}
                >
                  {isCreateMode ? "Sign up" : "Save changes"}
                </Button>
              ) : null}

              {isReRegistering && !selfInteractionLocked ? (
                <Button
                  variant="subtle"
                  onClick={() => {
                    setIsReRegistering(false);
                    if (selfRegistration) {
                      setNote(selfRegistration.note ?? "");
                      setAoeUrl(
                        `https://www.aoe2companion.com/players/${selfRegistration.aoe_id}`,
                      );
                    } else {
                      setNote("");
                      setAoeUrl("");
                    }
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </Group>
          </>
        )}
      </Stack>
    </CollapsibleTile>
  );
}