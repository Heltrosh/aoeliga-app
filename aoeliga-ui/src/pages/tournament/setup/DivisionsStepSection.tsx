import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconAlertCircle, IconPlus, IconTrash } from "@tabler/icons-react";
import type { UseMutationResult } from "@tanstack/react-query";

import { AppSurface } from "../../../components/common/AppSurface";
import { buildRulesetSelectOptions } from "../../../helpers/rulesetOptions";
import { useI18n } from "../../../i18n/I18nProvider";
import type { RulesetListItem } from "../../../api/schemas/rulesets";
import type {
  TournamentSetup,
  UpdateSetupDivisionsInput,
} from "../../../api/schemas/tournamentSetup";

type DivisionsStepSectionProps = {
  setup: TournamentSetup;
  rulesets: RulesetListItem[];
  mutation: UseMutationResult<TournamentSetup, Error, UpdateSetupDivisionsInput>;
};

type DivisionDraft = {
  name: string;
  ruleset_id: string;
};

export function DivisionsStepSection({
  setup,
  rulesets,
  mutation,
}: DivisionsStepSectionProps) {
  const { t } = useI18n();

  const [rows, setRows] = useState<DivisionDraft[]>([]);

  useEffect(() => {
    if (setup.divisions.length > 0) {
      setRows(
        setup.divisions.map((division) => ({
          name: division.name,
          ruleset_id: division.ruleset_id == null ? "none" : String(division.ruleset_id),
        })),
      );
      return;
    }

    setRows([{ name: t("tournament.setup.divisions.defaultDivisionName", { number: 1 }), ruleset_id: "none" }]);
  }, [setup.divisions, t]);

  const rulesetOptions = useMemo(
    () => buildRulesetSelectOptions(rulesets, t("landing.modal.fields.ruleset.none")),
    [rulesets, t],
  );

  function updateRow(index: number, patch: Partial<DivisionDraft>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((current) => [
      ...current,
      {
        name: t("tournament.setup.divisions.defaultDivisionName", { number: current.length + 1 }),
        ruleset_id: "none",
      },
    ]);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  async function handleSave() {
    await mutation.mutateAsync({
      divisions: rows.map((row) => ({
        name: row.name.trim(),
        ruleset_id: row.ruleset_id === "none" ? null : Number(row.ruleset_id),
      })),
    });
  }

  return (
    <AppSurface p="xl">
      <Stack gap="lg">
        <div>
          <Text fw={700} size="lg">
            {t("tournament.setup.divisions.title")}
          </Text>
          <Text c="dimmed" size="sm">
            {t("tournament.setup.divisions.description")}
          </Text>
        </div>

        {mutation.isError ? (
          <Alert color="red" variant="light" icon={<IconAlertCircle size={18} />}>
            {mutation.error?.message ?? t("tournament.setup.errors.saveFailed")}
          </Alert>
        ) : null}

        <Stack gap="md">
          {rows.map((row, index) => (
            <AppSurface key={`${index}-${row.name}`} variant="card" p="md">
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Text fw={600}>
                    {t("tournament.setup.divisions.rowTitle", { number: index + 1 })}
                  </Text>

                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => removeRow(index)}
                    disabled={rows.length <= 1}
                    aria-label={t("tournament.setup.divisions.remove")}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>

                <TextInput
                  label={t("tournament.setup.divisions.name")}
                  value={row.name}
                  onChange={(event) => updateRow(index, { name: event.currentTarget.value })}
                />

                <Select
                  label={t("tournament.setup.divisions.ruleset")}
                  data={rulesetOptions}
                  value={row.ruleset_id}
                  onChange={(value) => updateRow(index, { ruleset_id: value ?? "none" })}
                />
              </Stack>
            </AppSurface>
          ))}
        </Stack>

        <Group justify="space-between">
          <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addRow}>
            {t("tournament.setup.divisions.add")}
          </Button>

          <Button loading={mutation.isPending} onClick={handleSave}>
            {t("tournament.setup.actions.saveDivisions")}
          </Button>
        </Group>
      </Stack>
    </AppSurface>
  );
}
