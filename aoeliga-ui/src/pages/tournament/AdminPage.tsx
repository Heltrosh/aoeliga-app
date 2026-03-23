import { Alert, Loader, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useParams } from "react-router-dom";

import { useTournamentAdminData } from "../../hooks/useTournamentAdminData";
import { useTournament } from "../../hooks/useTournament";
import { useTournamentAccess } from "../../hooks/useTournamentAccess";
import { AdminPlayersSection } from "./admin/AdminPlayersSection";
import { AdminStaffSection } from "./admin/AdminStaffSection";
import { AdminStreamersSection } from "./admin/AdminStreamersSection";
import { useI18n } from "../../i18n/I18nProvider";

export default function AdminPage() {
  const { slug } = useParams();
  const { tournament } = useTournament();
  const { t } = useI18n();
  const access = useTournamentAccess();
  const { users, adminMembers, streamerMembers, playerMembers, isLoading } = useTournamentAdminData(slug);

  const canSeePage =
    access.canAssignAdmins || access.canAssignStreamers || access.canManagePlayers;

  if (!canSeePage) {
    return (
      <Alert icon={<IconAlertCircle size={20} />} color="red" variant="light">
        {t("common.pageAccessDenied")}
      </Alert>
    );
  }

  if (!slug) {
    return (
      <Alert icon={<IconAlertCircle size={20} />} color="red" variant="light">
        {t("tournament.admin.noslug")}
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>{t("tournament.nav.administration")}</Title>
        <Text c="dimmed">{t("tournament.admin.description", {name: tournament?.name ?? t("tournament.admin.description.fallback"),})}</Text>
      </div>

      {isLoading && <Loader />}

      <Stack gap="lg">
        {(access.canAssignAdmins || access.canAssignStreamers) && (
          <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg" style={{ alignItems: "start" }}>
            {access.canAssignAdmins && (
              <div style={{ alignSelf: "start" }}>
                <AdminStaffSection slug={slug} users={users} adminMembers={adminMembers} />
              </div>
            )}

            {access.canAssignStreamers && (
              <div style={{ alignSelf: "start" }}>
                <AdminStreamersSection slug={slug} users={users} streamerMembers={streamerMembers} />
              </div>
            )}
          </SimpleGrid>
        )}

        {access.canManagePlayers && (
          <AdminPlayersSection slug={slug} users={users} playerMembers={playerMembers} />
        )}
      </Stack>
    </Stack>
  );
}
