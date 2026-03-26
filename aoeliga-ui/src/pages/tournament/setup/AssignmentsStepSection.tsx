import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { IconAlertCircle, IconArrowsShuffle } from "@tabler/icons-react";
import type { UseMutationResult } from "@tanstack/react-query";

import { AppSurface } from "../../../components/common/AppSurface";
import { useI18n } from "../../../i18n/I18nProvider";
import type {
  GenerateSetupAssignmentsInput,
  ReplaceSetupAssignmentsInput,
  TournamentSetup,
  TournamentSetupDistributionMode,
  TournamentSetupRatingKey,
} from "../../../api/schemas/tournamentSetup";
import { buildDivisionAssignmentDraft, getRatingValue, getRegistrationName } from "./helpers";

type AssignmentsStepSectionProps = {
  setup: TournamentSetup;
  generateMutation: UseMutationResult<TournamentSetup, Error, GenerateSetupAssignmentsInput>;
  saveMutation: UseMutationResult<TournamentSetup, Error, ReplaceSetupAssignmentsInput>;
};

type AssignmentDraftRow = {
  registration_id: number;
  setup_division_id: number | null;
  sort_order: number;
};

const ratingKeyOptions: Array<{ value: TournamentSetupRatingKey; label: string }> = [
  { value: "signup_rating", label: "signup 1v1" },
  { value: "signup_max_rating", label: "signup max" },
  { value: "signup_team_rating", label: "signup team" },
  { value: "signup_max_team_rating", label: "signup team max" },
  { value: "current_rating", label: "current 1v1" },
  { value: "current_max_rating", label: "current max" },
  { value: "current_team_rating", label: "current team" },
  { value: "current_max_team_rating", label: "current team max" },
];

export function AssignmentsStepSection({
  setup,
  generateMutation,
  saveMutation,
}: AssignmentsStepSectionProps) {
  const { t } = useI18n();

  const [distributionMode, setDistributionMode] = useState<TournamentSetupDistributionMode>("rating");
  const [ratingKey, setRatingKey] = useState<TournamentSetupRatingKey>("current_rating");
  const [rows, setRows] = useState<AssignmentDraftRow[]>([]);

  useEffect(() => {
    setDistributionMode(setup.session.distribution_mode ?? "rating");
    setRatingKey(setup.session.selected_rating_key ?? "current_rating");
    setRows(buildDivisionAssignmentDraft(setup));
  }, [setup]);

  const registrationMap = useMemo(
    () => new Map(setup.eligible_registrations.map((row) => [row.registration_id, row])),
    [setup.eligible_registrations],
  );

  const divisionOptions = useMemo(
    () =>
      setup.divisions.map((division) => ({
        value: String(division.id),
        label: division.name,
      })),
    [setup.divisions],
  );

  const missingAssignments = rows.filter((row) => row.setup_division_id == null).length;

  function updateRow(registrationId: number, patch: Partial<AssignmentDraftRow>) {
    setRows((current) =>
      current.map((row) =>
        row.registration_id === registrationId ? { ...row, ...patch } : row,
      ),
    );
  }

  async function handleGenerate() {
    await generateMutation.mutateAsync({
      distribution_mode: distributionMode,
      ...(distributionMode === "rating" ? { rating_key: ratingKey } : {}),
    });
  }

  async function handleSave() {
    await saveMutation.mutateAsync({
      assignments: rows.map((row) => ({
        registration_id: row.registration_id,
        setup_division_id: Number(row.setup_division_id),
        sort_order: row.sort_order,
      })),
    });
  }

  return (
    <Stack gap="lg">
      <AppSurface p="xl">
        <Stack gap="lg">
          <div>
            <Text fw={700} size="lg">
              {t("tournament.setup.players.title")}
            </Text>
            <Text c="dimmed" size="sm">
              {t("tournament.setup.players.description")}
            </Text>
          </div>

          {setup.divisions.length === 0 ? (
            <Alert color="yellow" variant="light" icon={<IconAlertCircle size={18} />}>
              {t("tournament.setup.players.noDivisions")}
            </Alert>
          ) : null}

          {setup.eligible_registrations.length === 0 ? (
            <Alert color="yellow" variant="light" icon={<IconAlertCircle size={18} />}>
              {t("tournament.setup.players.noApproved")}
            </Alert>
          ) : null}

          <Group align="flex-end">
            <Select
              label={t("tournament.setup.players.distributionMode")}
              data={[
                { value: "rating", label: t("tournament.setup.players.distributionModes.rating") },
                { value: "random", label: t("tournament.setup.players.distributionModes.random") },
              ]}
              value={distributionMode}
              onChange={(value) => setDistributionMode((value as TournamentSetupDistributionMode) ?? "rating")}
              w={220}
            />

            <Select
              label={t("tournament.setup.players.ratingKey")}
              data={ratingKeyOptions.map((option) => ({
                value: option.value,
                label: t(`tournament.setup.players.ratingKeys.${option.value}`),
              }))}
              value={ratingKey}
              onChange={(value) => setRatingKey((value as TournamentSetupRatingKey) ?? "current_rating")}
              disabled={distributionMode !== "rating"}
              w={240}
            />

            <Button
              leftSection={<IconArrowsShuffle size={16} />}
              loading={generateMutation.isPending}
              onClick={handleGenerate}
              disabled={setup.divisions.length === 0 || setup.eligible_registrations.length === 0}
            >
              {t("tournament.setup.actions.generateAssignments")}
            </Button>
          </Group>

          {generateMutation.isError ? (
            <Alert color="red" variant="light" icon={<IconAlertCircle size={18} />}>
              {generateMutation.error?.message ?? t("tournament.setup.errors.saveFailed")}
            </Alert>
          ) : null}

          {saveMutation.isError ? (
            <Alert color="red" variant="light" icon={<IconAlertCircle size={18} />}>
              {saveMutation.error?.message ?? t("tournament.setup.errors.saveFailed")}
            </Alert>
          ) : null}
        </Stack>
      </AppSurface>

      {rows.length > 0 ? (
        <AppSurface p="xl">
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Text fw={600}>{t("tournament.setup.players.assignmentTable")}</Text>
              <Text size="sm" c={missingAssignments > 0 ? "yellow" : "dimmed"}>
                {missingAssignments > 0
                  ? t("tournament.setup.players.unassignedCount", { count: missingAssignments })
                  : t("tournament.setup.players.allAssigned")}
              </Text>
            </Group>

            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("tournament.setup.players.columns.player")}</Table.Th>
                  <Table.Th>{t("tournament.setup.players.columns.aoe")}</Table.Th>
                  <Table.Th>{t(`tournament.setup.players.ratingKeys.${ratingKey}`)}</Table.Th>
                  <Table.Th>{t("tournament.setup.players.columns.division")}</Table.Th>
                  <Table.Th>{t("tournament.setup.players.columns.order")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row) => {
                  const registration = registrationMap.get(row.registration_id);
                  if (!registration) return null;

                  return (
                    <Table.Tr key={row.registration_id}>
                      <Table.Td>{getRegistrationName(registration)}</Table.Td>
                      <Table.Td>{registration.aoe_name}</Table.Td>
                      <Table.Td>{getRatingValue(registration, ratingKey) ?? "—"}</Table.Td>
                      <Table.Td>
                        <Select
                          data={divisionOptions}
                          value={row.setup_division_id == null ? null : String(row.setup_division_id)}
                          onChange={(value) =>
                            updateRow(row.registration_id, {
                              setup_division_id: value == null ? null : Number(value),
                            })
                          }
                          clearable
                        />
                      </Table.Td>
                      <Table.Td>
                        <NumberInput
                          min={1}
                          value={row.sort_order}
                          onChange={(value) =>
                            updateRow(row.registration_id, {
                              sort_order:
                                typeof value === "number" && value > 0 ? value : row.sort_order,
                            })
                          }
                        />
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>

            <Group justify="flex-end">
              <Button
                loading={saveMutation.isPending}
                onClick={handleSave}
                disabled={rows.length === 0 || missingAssignments > 0}
              >
                {t("tournament.setup.actions.saveAssignments")}
              </Button>
            </Group>
          </Stack>
        </AppSurface>
      ) : null}
    </Stack>
  );
}
