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
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useI18n } from "../../i18n/I18nProvider";
import { useLandingPage } from "../../hooks/useLandingPage";
import type { TournamentListItem } from "../../api/schemas/tournaments";
import {
  editTournamentFormSchema,
  type EditTournamentFormValues,
  isoToYmd,
  ymdToMidnightIso,
} from "./editTournamentForm";

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
  const { updateTournamentMutation } = useLandingPage();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<EditTournamentFormValues>({
    resolver: zodResolver(editTournamentFormSchema),
    values: tournament
      ? {
          name: tournament.name,
          description: tournament.description ?? "",
          status: tournament.status,
          starts_at: isoToYmd(tournament.starts_at),
          ends_at: isoToYmd(tournament.ends_at),
        }
      : {
          name: "",
          description: "",
          status: "draft",
          starts_at: null,
          ends_at: null,
        },
  });

  const name = form.watch("name");
  const startsAt = form.watch("starts_at");

  const canSubmit = useMemo(() => {
    const values = form.getValues();
    return values.name.trim().length > 0 && !updateTournamentMutation.isPending;
  }, [form, name, updateTournamentMutation.isPending]);

  function handleClose() {
    setSubmitError(null);
    form.reset();
    onClose();
  }

  return (
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
  );
}