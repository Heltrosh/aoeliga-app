import { Loader, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconUserOff } from "@tabler/icons-react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../../../auth/AuthContext";
import { useLandingPage } from "../../../hooks/useLandingPage";
import { getLandingNavigationAccess } from "../landingAccess";
import { LandingShell } from "../LandingShell";
import { useI18n } from "../../../i18n/I18nProvider";
import { AppSurface } from "../../../components/common/AppSurface";


function AdminTile({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <AppSurface variant="card" p="md" interactive onClick={onClick}>
      <Stack gap="sm">
        {icon ? (
          <div
            style={{
              color: "#f3f4f6",
              lineHeight: 0,
            }}
          >
            {icon}
          </div>
        ) : null}

        <Stack gap={4}>
          <Text fw={700} size="lg">
            {title}
          </Text>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        </Stack>
      </Stack>
    </AppSurface>
  );
}

export default function GlobalAdminPage() {
  const { user } = useAuth();
  const { tournamentsQuery } = useLandingPage();
  const { t } = useI18n();
  const navigate = useNavigate();

  const tournaments = tournamentsQuery.data?.tournaments ?? [];
  const { canSeeRulesets, canSeeAdmin } = getLandingNavigationAccess(
    user,
    tournaments,
  );

  if (!tournamentsQuery.isLoading && !canSeeAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <LandingShell
      section="admin"
      title={t("landing.title.admin")}
      canSeeRulesets={canSeeRulesets}
      canSeeAdmin={canSeeAdmin}
    >
      {tournamentsQuery.isLoading ? (
        <Loader />
      ) : (
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            <AdminTile
              title={t("landing.admin.users.title")}
              description={t("landing.admin.users.description")}
              icon={<IconUserOff size={20} />}  
              onClick={() => navigate("/admin/users")}
            />
          </SimpleGrid>
        </Stack>
      )}
    </LandingShell>
  );
}