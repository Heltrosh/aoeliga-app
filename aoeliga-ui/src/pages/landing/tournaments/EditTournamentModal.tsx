import { useMemo, useState } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
  Text,
  Select,
  Box,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useI18n } from "../../../i18n/I18nProvider";
import { useLandingPage } from "../../../hooks/useLandingPage";
import { RulesetDetailsModal } from "../../../components/rulesets/RulesetDetailsModal";
import { buildRulesetSelectOptions } from "../../../helpers/rulesetOptions";
import type { TournamentListItem } from "../../../api/schemas/tournaments";
import {
  editTournamentFormSchema,
  type EditTournamentFormValues,
  isoToYmd,
  ymdToMidnightIso,
} from "./editTournamentForm";
import { IconEye } from "@tabler/icons-react";

type EditTournamentModalProps = {
  tournament: TournamentListItem | null;
  opened: boolean;
  onClose: () => void;
};

export function EditTournamentModal({
  tournament,
  opened,
  onClose,
}: EditTournamentModalProps) {
  const { t } = useI18n();
  const { updateTournamentMutation, rulesetsQuery } = useLandingPage();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [viewRulesetId, setViewRulesetId] = useState<number | null>(null);

  const form = useForm<EditTournamentFormValues>({
    resolver: zodResolver(editTournamentFormSchema),
    values: tournament
      ? {
          name: tournament.name,
          description: tournament.description ?? "",
          status: tournament.status,
          starts_at: isoToYmd(tournament.starts_at),
          ends_at: isoToYmd(tournament.ends_at),
          default_ruleset:
            tournament.default_ruleset == null
              ? "none"
              : String(tournament.default_ruleset),
        }
      : {
          name: "",
          description: "",
          status: "draft",
          starts_at: null,
          ends_at: null,
          default_ruleset: "none",
        },
  });

  const name = form.watch("name");
  const startsAt = form.watch("starts_at");
  const selectedRuleset = form.watch("default_ruleset");

  const rulesetOptions = useMemo(
    () => buildRulesetSelectOptions(rulesetsQuery.data ?? [], t("landing.editTournament.fields.ruleset.none")),
    [rulesetsQuery.data],
  );

  const canSubmit = useMemo(() => {
    const values = form.getValues();
    return values.name.trim().length > 0 && !updateTournamentMutation.isPending;
  }, [form, name, updateTournamentMutation.isPending]);

  function handleClose() {
    setSubmitError(null);
    setViewRulesetId(null);
    form.reset();
    onClose();
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title={t("landing.editTournament.title")}
        centered
      >
        <form
          onSubmit={form.handleSubmit(async (values) => {
            if (!tournament) return;

            try {
              setSubmitError(null);

              await updateTournamentMutation.mutateAsync({
                slug: tournament.slug,
                input: {
                  name: values.name.trim(),
                  description: values.description?.trim() || null,
                  status: values.status,
                  starts_at: values.starts_at
                    ? ymdToMidnightIso(values.starts_at)
                    : null,
                  ends_at: values.ends_at
                    ? ymdToMidnightIso(values.ends_at)
                    : null,
                  default_ruleset:
                    values.default_ruleset === "none"
                      ? null
                      : Number(values.default_ruleset),
                },
              });

              handleClose();
            } catch (e: unknown) {
              setSubmitError(
                e instanceof Error
                  ? e.message
                  : t("landing.editTournament.errors.submitFailed"),
              );
            }
          })}
        >
          <Stack gap="sm">
            <TextInput
              label={t("landing.editTournament.fields.name.label")}
              placeholder={t("landing.editTournament.fields.name.placeholder")}
              required
              {...form.register("name")}
              error={form.formState.errors.name?.message}
            />

            <Textarea
              label={t("landing.editTournament.fields.description.label")}
              minRows={3}
              placeholder={t("landing.editTournament.fields.description.placeholder")}
              {...form.register("description")}
              error={form.formState.errors.description?.message}
            />

            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select
                  label={t("landing.editTournament.fields.status.label")}
                  data={[
                    { value: "draft", label: t("tournament.status.draft") },
                    { value: "signup", label: t("tournament.status.signup") },
                    { value: "active", label: t("tournament.status.active") },
                    { value: "completed", label: t("tournament.status.completed") },
                    { value: "archived", label: t("tournament.status.archived") },
                  ]}
                  value={field.value}
                  onChange={(value) => {
                    if (value) field.onChange(value);
                  }}
                  error={form.formState.errors.status?.message}
                />
              )}
            />

            <Group align="flex-end" gap="sm" wrap="nowrap">
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Controller
                  control={form.control}
                  name="default_ruleset"
                  render={({ field }) => (
                    <Select
                      label={t("landing.editTournament.fields.ruleset.label")}
                      placeholder="Select ruleset"
                      data={rulesetOptions}
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? "none")}
                      disabled={rulesetsQuery.isPending}
                      error={form.formState.errors.default_ruleset?.message}
                    />
                  )}
                />
              </Box>

              <Button
                variant="default"
                leftSection={<IconEye size={16} />}
                disabled={
                  selectedRuleset === "none" ||
                  selectedRuleset == null ||
                  rulesetsQuery.isPending
                }
                onClick={() => {
                  if (selectedRuleset && selectedRuleset !== "none") {
                    setViewRulesetId(Number(selectedRuleset));
                  }
                }}
                style={{ flexShrink: 0 }}
              >
                {t("landing.createTournament.fields.ruleset.view")}
              </Button>
            </Group>

            <Group grow>
              <Controller
                control={form.control}
                name="starts_at"
                render={({ field }) => (
                  <DateInput
                    label={t("landing.editTournament.fields.startsAt.label")}
                    value={field.value}
                    onChange={field.onChange}
                    clearable
                    valueFormat="YYYY-MM-DD"
                    placeholder={t("landing.editTournament.fields.startsAt.placeholder")}
                  />
                )}
              />

              <Controller
                control={form.control}
                name="ends_at"
                render={({ field }) => (
                  <DateInput
                    label={t("landing.editTournament.fields.endsAt.label")}
                    value={field.value}
                    onChange={field.onChange}
                    clearable
                    valueFormat="YYYY-MM-DD"
                    placeholder={t("landing.editTournament.fields.endsAt.placeholder")}
                    minDate={startsAt ?? undefined}
                  />
                )}
              />
            </Group>

          {submitError && (
            <Text c="red" size="sm">
              {submitError}
            </Text>
          )}

          <Group justify="flex-end">
            <Button variant="subtle" onClick={handleClose}>
              {t("common.cancel")}
            </Button>

            <Button
              color="gold"
              loading={updateTournamentMutation.isPending}
              disabled={!canSubmit}
              type="submit"
            >
              {t("landing.editTournament.actions.save")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>

    <RulesetDetailsModal
      opened={viewRulesetId != null}
      onClose={() => setViewRulesetId(null)}
      rulesetId={viewRulesetId}
    />
  </>
);
}