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
import { IconAlertCircle } from "@tabler/icons-react";
import type { UseMutationResult } from "@tanstack/react-query";

import { AppSurface } from "../../../components/common/AppSurface";
import { useI18n } from "../../../i18n/I18nProvider";
import type {
  ReplaceSetupMatchesInput,
  TournamentSetup,
  TournamentSetupMatch,
} from "../../../api/schemas/tournamentSetup";
import { buildMatchesDraft, getRegistrationName, groupAssignmentsByDivision } from "./helpers";

type MatchesStepSectionProps = {
  setup: TournamentSetup;
  generateMutation: UseMutationResult<TournamentSetup, Error, void, unknown>;
  saveMutation: UseMutationResult<TournamentSetup, Error, ReplaceSetupMatchesInput, unknown>;
};

export function MatchesStepSection({
  setup,
  generateMutation,
  saveMutation,
}: MatchesStepSectionProps) {
  const { t } = useI18n();
  const [rows, setRows] = useState<TournamentSetupMatch[]>([]);

  useEffect(() => {
    setRows(buildMatchesDraft(setup));
  }, [setup]);

  const assignmentsByDivision = useMemo(() => groupAssignmentsByDivision(setup), [setup]);

  const groupedRows = useMemo(() => {
    const buckets = new Map<number, TournamentSetupMatch[]>();
    for (const division of setup.divisions) buckets.set(division.id, []);
    for (const row of rows) {
      const bucket = buckets.get(row.setup_division_id) ?? [];
      bucket.push(row);
      buckets.set(row.setup_division_id, bucket);
    }
    return buckets;
  }, [rows, setup.divisions]);

  function updateRow(matchId: number, patch: Partial<TournamentSetupMatch>) {
    setRows((current) => current.map((row) => (row.id === matchId ? { ...row, ...patch } : row)));
  }

  async function handleSave() {
    await saveMutation.mutateAsync({
      matches: rows.map((row) => ({
        setup_division_id: row.setup_division_id,
        stage_key: row.stage_key,
        stage_type: row.stage_type,
        round_number: row.round_number,
        round_label: row.round_label,
        week_number: row.week_number,
        format_id: row.format_id,
        player1_registration_id: row.player1_registration_id,
        player2_registration_id: row.player2_registration_id,
      })),
    });
  }

  return (
    <Stack gap="lg">
      <AppSurface p="xl">
        <Stack gap="lg">
          <div>
            <Text fw={700} size="lg">
              {t("tournament.setup.matches.title")}
            </Text>
            <Text c="dimmed" size="sm">
              {t("tournament.setup.matches.description")}
            </Text>
          </div>

          {setup.divisions.length === 0 ? (
            <Alert color="yellow" variant="light" icon={<IconAlertCircle size={18} />}>
              {t("tournament.setup.matches.noDivisions")}
            </Alert>
          ) : null}

          {setup.assignments.length === 0 ? (
            <Alert color="yellow" variant="light" icon={<IconAlertCircle size={18} />}>
              {t("tournament.setup.matches.noAssignments")}
            </Alert>
          ) : null}

          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {rows.length > 0
                ? t("tournament.setup.matches.generatedCount", { count: rows.length })
                : t("tournament.setup.matches.notGenerated")}
            </Text>

            <Group>
              <Button
                variant="light"
                loading={generateMutation.isPending}
                onClick={() => generateMutation.mutate()}
                disabled={setup.divisions.length === 0 || setup.assignments.length === 0}
              >
                {t("tournament.setup.actions.generateMatches")}
              </Button>

              <Button
                loading={saveMutation.isPending}
                onClick={handleSave}
                disabled={rows.length === 0}
              >
                {t("tournament.setup.actions.saveMatches")}
              </Button>
            </Group>
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

      {setup.divisions.map((division) => {
        const matches = groupedRows.get(division.id) ?? [];
        const players = assignmentsByDivision.get(division.id) ?? [];
        const playerOptions = players.map((assignment) => ({
          value: String(assignment.registration_id),
          label: getRegistrationName(assignment),
        }));

        return (
          <AppSurface key={division.id} p="xl">
            <Stack gap="md">
              <Group justify="space-between">
                <div>
                  <Text fw={700}>{division.name}</Text>
                  <Text size="sm" c="dimmed">
                    {t("tournament.setup.matches.divisionSummary", {
                      count: matches.length,
                    })}
                  </Text>
                </div>
              </Group>

              {matches.length === 0 ? (
                <Text c="dimmed" size="sm">
                  {t("tournament.setup.matches.noMatchesForDivision")}
                </Text>
              ) : (
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t("tournament.setup.matches.columns.round")}</Table.Th>
                      <Table.Th>{t("tournament.setup.matches.columns.week")}</Table.Th>
                      <Table.Th>{t("tournament.setup.matches.columns.player1")}</Table.Th>
                      <Table.Th>{t("tournament.setup.matches.columns.player2")}</Table.Th>
                      <Table.Th>{t("tournament.setup.matches.columns.format")}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {matches.map((match) => (
                      <Table.Tr key={match.id}>
                        <Table.Td>
                          <NumberInput
                            min={1}
                            value={match.round_number}
                            onChange={(value) =>
                              updateRow(match.id, {
                                round_number:
                                  typeof value === "number" && value > 0
                                    ? value
                                    : match.round_number,
                              })
                            }
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            min={1}
                            value={match.week_number ?? undefined}
                            onChange={(value) =>
                              updateRow(match.id, {
                                week_number:
                                  typeof value === "number" && value > 0 ? value : null,
                              })
                            }
                          />
                        </Table.Td>
                        <Table.Td>
                          <Select
                            clearable
                            data={playerOptions}
                            value={
                              match.player1_registration_id == null
                                ? null
                                : String(match.player1_registration_id)
                            }
                            onChange={(value) =>
                              updateRow(match.id, {
                                player1_registration_id:
                                  value == null ? null : Number(value),
                              })
                            }
                          />
                        </Table.Td>
                        <Table.Td>
                          <Select
                            clearable
                            data={playerOptions}
                            value={
                              match.player2_registration_id == null
                                ? null
                                : String(match.player2_registration_id)
                            }
                            onChange={(value) =>
                              updateRow(match.id, {
                                player2_registration_id:
                                  value == null ? null : Number(value),
                              })
                            }
                          />
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{match.format_id}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Stack>
          </AppSurface>
        );
      })}
    </Stack>
  );
}
