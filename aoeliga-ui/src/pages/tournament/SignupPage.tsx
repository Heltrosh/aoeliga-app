import { Alert, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle, IconInfoCircle } from "@tabler/icons-react";

import { useTournament } from "../../hooks/useTournament";
import { useTournamentAccess } from "../../hooks/useTournamentAccess";
import { useAuth } from "../../auth/AuthContext";
import { useI18n } from "../../i18n/I18nProvider";

import { useSignupPageState } from "./signup/useSignupPageState";
import { SelfRegistrationSection } from "./signup/SelfRegistrationSection";
import { RegistrationSettingsSection } from "./signup/RegistrationSettingsSection";
import { RegistrationsTableSection } from "./signup/RegistrationsTableSection";
import { ReviewModal } from "./signup/ReviewModal";
import { DetailsModal } from "./signup/DetailsModal";
import { AdminRegistrationSection } from "./signup/AdminRegistrationSection";
import { SetupEntrySection } from "./signup/SetupEntrySection";

export default function SignupPage() {
  const { tournament } = useTournament();
  const access = useTournamentAccess();
  const { user } = useAuth();
  const { t } = useI18n();

  const state = useSignupPageState({
    tournament,
    access,
    user,
  });

  if (!tournament) {
    return null;
  }

  if (!user) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
        {t("common.pageAccessDenied")}
      </Alert>
    );
  }

  const isStaff = access.canManageTournament || access.canManagePlayers;
  const registrationsClosed =
    tournament.status === "signup" && (tournament.registrations_open ?? 0) !== 1;

  const shouldHideSelfRegistrationSection =
    registrationsClosed && state.isCreateMode;

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>{t("tournament.signup.pageTitle")}</Title>
        <Text c="dimmed">
          {isStaff
            ? t("tournament.signup.pageDescription.staff", {
                tournament: tournament.name,
              })
            : t("tournament.signup.pageDescription.user", {
                tournament: tournament.name,
              })}
        </Text>
      </div>

      {registrationsClosed ? (
        <Alert icon={<IconInfoCircle size={20} />} color="blue" variant="light">
          {t("tournament.signup.closed.message")}
          {!isStaff ? (
            <>
              <br />
              {t("tournament.signup.closed.contact")}
            </>
          ) : null}
        </Alert>
      ) : null}

      {state.showSelfSection && !shouldHideSelfRegistrationSection ? (
        <SelfRegistrationSection state={state} />
      ) : null}

      {state.showRegistrationsTableSection ? (
        <RegistrationsTableSection state={state} />
      ) : null}

      <ReviewModal state={state} />
      <DetailsModal state={state} />

      {state.showSettingsSection ? (
        <Stack gap="lg">
          <AdminRegistrationSection state={state} />
          <SimpleGrid
            cols={{ base: 1, xl: 2 }}
            spacing="lg"
            style={{ alignItems: "start" }}
          >
            <div style={{ alignSelf: "start" }}>
              <RegistrationSettingsSection state={state} />
            </div>

            <div style={{ alignSelf: "start" }}>
              <SetupEntrySection state={state} />
            </div>
          </SimpleGrid>
        </Stack>
      ) : null}
    </Stack>
  );
}