import { Badge, Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

import { useI18n } from "../../../i18n/I18nProvider";

type SetupWizardHeaderProps = {
  tournamentSlug: string;
  tournamentName: string;
  status: "draft" | "ready" | "applied";
};

export function SetupWizardHeader({
  tournamentSlug,
  tournamentName,
  status,
}: SetupWizardHeaderProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const badgeColor =
    status === "ready" ? "green" : status === "applied" ? "blue" : "gray";

  return (
    <Group justify="space-between" align="flex-start">
      <Stack gap={4}>
        <Title order={2}>{t("tournament.setup.pageTitle")}</Title>
        <Text c="dimmed">
          {t("tournament.setup.pageDescription", { tournament: tournamentName })}
        </Text>
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            {t("tournament.setup.sessionStatusLabel")}
          </Text>
          <Badge color={badgeColor} variant="light">
            {t(`tournament.setup.sessionStatus.${status}`)}
          </Badge>
        </Group>
      </Stack>

      <Button
        variant="light"
        leftSection={<IconArrowLeft size={16} />}
        onClick={() => navigate(`/t/${tournamentSlug}/signup`)}
      >
        {t("tournament.setup.backToSignup")}
      </Button>
    </Group>
  );
}
