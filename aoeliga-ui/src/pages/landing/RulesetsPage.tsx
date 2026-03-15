import { Loader, Paper, Stack, Text, Title } from "@mantine/core";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import { useLandingPage } from "../../hooks/useLandingPage";
import { getLandingNavigationAccess } from "./landingAccess";
import { LandingShell } from "./LandingShell";
import { useI18n } from "../../i18n/I18nProvider";

export default function RulesetsPage() {
  const { user } = useAuth();
  const { tournamentsQuery } = useLandingPage();
  const { t } = useI18n();

  const tournaments = tournamentsQuery.data?.tournaments ?? [];
  const { canSeeRulesets, canSeeAdmin } = getLandingNavigationAccess(
    user,
    tournaments,
  );

  if (!tournamentsQuery.isLoading && !canSeeRulesets) {
    return <Navigate to="/" replace />;
  }

  return (
    <LandingShell
      section="rulesets"
      title={t("landing.title.rulesets")}
      canSeeRulesets={canSeeRulesets}
      canSeeAdmin={canSeeAdmin}
    >
      {tournamentsQuery.isLoading ? (
        <Loader />
      ) : (
        <Paper withBorder radius="md" p="xl">
          <Stack gap="xs">
            <Title order={3}>Rulesets</Title>
            <Text c="dimmed">
              Rulesets management will live here.
            </Text>
          </Stack>
        </Paper>
      )}
    </LandingShell>
  );
}