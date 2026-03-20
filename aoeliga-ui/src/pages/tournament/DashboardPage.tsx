import { Text, Title } from "@mantine/core";
import { useI18n } from "../../i18n/I18nProvider";

export default function DashboardPage() {
  const { t } = useI18n();


  return (
    <>
      <Title order={2}>{t("tournament.dashboard")}</Title>
      <Text c="dimmed">{t("tournament.placeholder")}</Text>
    </>
  );
}