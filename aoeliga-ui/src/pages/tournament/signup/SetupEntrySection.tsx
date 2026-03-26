import { Button, Stack } from "@mantine/core";
import { useNavigate } from "react-router-dom";

import { CollapsibleTile } from "../../../components/tournament-admin/shared";
import { useI18n } from "../../../i18n/I18nProvider";
import type { SignupPageState } from "./useSignupPageState";

export function SetupEntrySection({
  state,
}: {
  state: SignupPageState;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();

  const { tournament } = state;

  const canOpenSetup =
    tournament.status === "signup" || tournament.status === "draft";

  return (
    <CollapsibleTile
      title={t("tournament.signup.setupEntry.title")}
      subtitle={t("tournament.signup.setupEntry.subtitle")}
      defaultOpen
    >
      <Stack gap="md">
        <Button
          onClick={() => navigate(`/t/${tournament.slug}/setup`)}
          disabled={!canOpenSetup}
        >
          {t("tournament.signup.setupEntry.action")}
        </Button>
      </Stack>
    </CollapsibleTile>
  );
}