import { Alert, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

import { useTournament } from "../../hooks/useTournament";
import { useTournamentAccess } from "../../hooks/useTournamentAccess";
import { useAuth } from "../../auth/AuthContext";

import { useSignupPageState } from "./signup/useSignupPageState";
import { SelfRegistrationSection } from "./signup/SelfRegistrationSection";
import { RegistrationSettingsSection } from "./signup/RegistrationSettingsSection";
import { RegistrationsTableSection } from "./signup/RegistrationsTableSection";
import { ReviewModal } from "./signup/ReviewModal";
import { DetailsModal } from "./signup/DetailsModal";
import { AdminRegistrationSection } from "./signup/AdminRegistrationSection";

export default function SignupPage() {
  const { tournament } = useTournament();
  const access = useTournamentAccess();
  const { user } = useAuth();

  const state = useSignupPageState({
    tournament,
    access,
    user,
  });

  if (!tournament) {
    return null;
  }

  if (!user || !state.canUserAccessPage) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
        You do not have access to this page.
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Signup</Title>
        <Text c="dimmed">
          Sign up for {tournament.name} and manage registrations.
        </Text>
      </div>

      {state.isClosedForNormalUser ? (
        <Alert color="yellow" variant="light">
          Registrations for this tournament are closed.
          <br />
          <br />
          Contact tournament administrators if you need help with signups or changes.
        </Alert>
      ) : null}

      {state.showSelfSection && <SelfRegistrationSection state={state} />}

      {state.showRegistrationsTableSection && (
        <RegistrationsTableSection state={state} />
      )}

      <ReviewModal state={state} />
      <DetailsModal state={state} />

      {state.showSettingsSection && (
        <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg" style={{ alignItems: "start" }}>
          <div style={{ alignSelf: "start" }}>
            <RegistrationSettingsSection state={state} />
          </div>

          <div style={{ alignSelf: "start" }}>
            <AdminRegistrationSection state={state} />
          </div>
        </SimpleGrid>
      )}
    </Stack>
  );
}