import { useEffect, useMemo, useState } from "react";
import { Alert, Loader, Stack } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";

import { useTournament } from "../../hooks/useTournament";
import { useTournamentAccess } from "../../hooks/useTournamentAccess";
import { useI18n } from "../../i18n/I18nProvider";
import { useTournamentSetup } from "../../hooks/useTournamentSetup";
import { SetupWizardHeader } from "./setup/SetupWizardHeader";
import { SetupWizardStepNav } from "./setup/SetupWizardStepNav";
import { DivisionsStepSection } from "./setup/DivisionsStepSection";
import { AssignmentsStepSection } from "./setup/AssignmentsStepSection";
import { MatchesStepSection } from "./setup/MatchesStepSection";
import { ReviewStepSection } from "./setup/ReviewStepSection";
import type { SetupStepValue } from "./setup/helpers";

export default function SetupWizardPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { tournament } = useTournament();
  const access = useTournamentAccess();
  const { t } = useI18n();
  const [step, setStep] = useState<SetupStepValue>("divisions");

  const {
    setupQuery,
    rulesets,
    setup,
    updateDivisionsMutation,
    generateAssignmentsMutation,
    replaceAssignmentsMutation,
    generateMatchesMutation,
    replaceMatchesMutation,
    applySetupMutation,
    isLoading,
  } = useTournamentSetup(slug);

  const canAccessPage = access.canManageTournament;
  const canUseSetup =
    tournament?.status === "signup" || tournament?.status === "draft";

  useEffect(() => {
    if (applySetupMutation.isSuccess && tournament) {
      navigate(`/t/${tournament.slug}/dashboard`, { replace: true });
    }
  }, [applySetupMutation.isSuccess, navigate, tournament]);

  const stepContent = useMemo(() => {
    if (!setup) return null;

    switch (step) {
      case "divisions":
        return (
          <DivisionsStepSection
            setup={setup}
            rulesets={rulesets}
            mutation={updateDivisionsMutation}
          />
        );
      case "players":
        return (
          <AssignmentsStepSection
            setup={setup}
            generateMutation={generateAssignmentsMutation}
            saveMutation={replaceAssignmentsMutation}
          />
        );
      case "matches":
        return (
          <MatchesStepSection
            setup={setup}
            generateMutation={generateMatchesMutation}
            saveMutation={replaceMatchesMutation}
          />
        );
      case "review":
        return <ReviewStepSection setup={setup} mutation={applySetupMutation} />;
      default:
        return null;
    }
  }, [
    applySetupMutation,
    generateAssignmentsMutation,
    generateMatchesMutation,
    replaceAssignmentsMutation,
    replaceMatchesMutation,
    rulesets,
    setup,
    step,
    updateDivisionsMutation,
  ]);

  if (!tournament) {
    return null;
  }

  if (!canAccessPage) {
    return (
      <Alert icon={<IconAlertCircle size={20} />} color="red" variant="light">
        {t("common.pageAccessDenied")}
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      <SetupWizardHeader
        tournamentSlug={tournament.slug}
        tournamentName={tournament.name}
        status={(setup?.session.status ?? "draft") as "draft" | "ready" | "applied"}
      />

      {!canUseSetup ? (
        <Alert icon={<IconAlertCircle size={20} />} color="yellow" variant="light">
          {t("tournament.setup.unavailable")}
        </Alert>
      ) : null}

      {isLoading ? (
        <Loader color="gold" />
      ) : setupQuery.isError ? (
        <Alert icon={<IconAlertCircle size={20} />} color="red" variant="light">
          {t("tournament.setup.loadFailed")}
        </Alert>
      ) : setup ? (
        <>
          <SetupWizardStepNav setup={setup} value={step} onChange={setStep} />
          {stepContent}
        </>
      ) : null}
    </Stack>
  );
}
