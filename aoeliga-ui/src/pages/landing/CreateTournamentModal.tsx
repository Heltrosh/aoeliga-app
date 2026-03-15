import { useMemo, useState } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Grid,
  Stack,
  Group,
  Text,
  Select,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useI18n } from "../../i18n/I18nProvider";
import { useLandingPage } from "../../hooks/useLandingPage";
import { RulesetDetailsModal } from "../../components/rulesets/RulesetDetailsModal";
import { buildRulesetSelectOptions } from "../../helpers/rulesetOptions";
import {
  createTournamentFormSchema,
  type CreateTournamentFormValues,
  ymdToMidnightIso,
} from "./createTournamentForm";

type CreateTournamentModalProps = {
  opened: boolean;
  onClose: () => void;
};

export function CreateTournamentModal({
  opened,
  onClose,
}: CreateTournamentModalProps) {
  const { t } = useI18n();
  const { createTournamentMutation, rulesetsQuery } = useLandingPage();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [viewRulesetId, setViewRulesetId] = useState<number | null>(null);

  const form = useForm<CreateTournamentFormValues>({
    resolver: zodResolver(createTournamentFormSchema),
    defaultValues: {
      slug: "",
      name: "",
      description: "",
      starts_at: null,
      ends_at: null,
      default_ruleset: "none",
    },
  });

  const selectedRuleset = form.watch("default_ruleset");

  const rulesetOptions = useMemo(
    () => buildRulesetSelectOptions(rulesetsQuery.data ?? [], t("landing.editTournament.fields.ruleset.none")),
    [rulesetsQuery.data],
  );

  const canSubmit = useMemo(() => {
    const values = form.getValues();
    return (
      values.slug.trim().length > 0 &&
      values.name.trim().length > 0 &&
      !createTournamentMutation.isPending
    );
  }, [
    form,
    form.watch("slug"),
    form.watch("name"),
    createTournamentMutation.isPending,
  ]);

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
        title={t("landing.createTournament.title")}
        centered
      >
        <form
          onSubmit={form.handleSubmit(async (values) => {
            try {
              setSubmitError(null);

              await createTournamentMutation.mutateAsync({
                slug: values.slug.trim(),
                name: values.name.trim(),
                description: values.description?.trim() || null,
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
              });

              handleClose();
            } catch (e: unknown) {
              setSubmitError(
                e instanceof Error
                  ? e.message
                  : t("landing.createTournament.errors.submitFailed"),
              );
            }
          })}
        >
          <Stack gap="sm">
            <TextInput
              label={t("landing.createTournament.fields.slug.label")}
              placeholder={t("landing.createTournament.fields.slug.placeholder")}
              description={t("landing.createTournament.fields.slug.description")}
              required
              {...form.register("slug")}
              error={form.formState.errors.slug?.message}
            />

            <TextInput
              label={t("landing.createTournament.fields.name.label")}
              placeholder={t("landing.createTournament.fields.name.placeholder")}
              required
              {...form.register("name")}
              error={form.formState.errors.name?.message}
            />

            <Textarea
              label={t("landing.createTournament.fields.description.label")}
              minRows={3}
              placeholder={t(
                "landing.createTournament.fields.description.placeholder",
              )}
              {...form.register("description")}
              error={form.formState.errors.description?.message}
            />

            <Grid align="flex-end">
              <Grid.Col span={9}>
                <Controller
                  control={form.control}
                  name="default_ruleset"
                  render={({ field }) => (
                    <Select
                      label={t("landing.createTournament.fields.ruleset.label")}
                      placeholder="Select ruleset"
                      data={rulesetOptions}
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? "none")}
                      disabled={rulesetsQuery.isPending}
                      error={form.formState.errors.default_ruleset?.message}
                    />
                  )}
                />
              </Grid.Col>

              <Grid.Col span={3}>
                <Button
                  fullWidth
                  variant="default"
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
                >
                  {t("landing.createTournament.fields.ruleset.view")}
                </Button>
              </Grid.Col>
            </Grid>

            <Group grow>
              <Controller
                control={form.control}
                name="starts_at"
                render={({ field }) => (
                  <DateInput
                    label={t("landing.createTournament.fields.startsAt.label")}
                    value={field.value}
                    onChange={field.onChange}
                    clearable
                    valueFormat="YYYY-MM-DD"
                    placeholder={t(
                      "landing.createTournament.fields.startsAt.placeholder",
                    )}
                  />
                )}
              />

              <Controller
                control={form.control}
                name="ends_at"
                render={({ field }) => (
                  <DateInput
                    label={t("landing.createTournament.fields.endsAt.label")}
                    value={field.value}
                    onChange={field.onChange}
                    clearable
                    valueFormat="YYYY-MM-DD"
                    placeholder={t(
                      "landing.createTournament.fields.endsAt.placeholder",
                    )}
                    minDate={form.watch("starts_at") ?? undefined}
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
                loading={createTournamentMutation.isPending}
                disabled={!canSubmit}
                type="submit"
              >
                {t("landing.createTournament.actions.create")}
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