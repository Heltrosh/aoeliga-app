import { useMemo, useState } from "react";
import {
  Container,
  Title,
  SimpleGrid,
  Card,
  Text,
  Badge,
  Group,
  Loader,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Button,
  Stack,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconPlus } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { listTournaments, createTournament } from "../../api/tournaments";
import { useAuth } from "../../auth/AuthContext";
import { useI18n } from "../../i18n/I18nProvider";

type Tournament = {
  id: number;
  slug: string;
  name: string;
  status: string;
  description?: string | null;
};

const schema = z.object({
  slug: z.string().min(1, "Slug is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
});

type FormValues = z.infer<typeof schema>;

function ymdToMidnightIso(ymd: string): string {
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  const local = new Date(y, m - 1, d, 0, 0, 0, 0);
  return local.toISOString();
}

export default function LandingPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { t } = useI18n();

  const isGlobalAdmin = user?.is_admin === 1;

  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const tournamentsQuery = useQuery({
    queryKey: ["tournaments"],
    queryFn: listTournaments,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: "",
      name: "",
      description: "",
      starts_at: null,
      ends_at: null,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return createTournament({
        slug: values.slug.trim(),
        name: values.name.trim(),
        description: values.description?.trim() || null,
        starts_at: values.starts_at ? ymdToMidnightIso(values.starts_at) : null,
        ends_at: values.ends_at ? ymdToMidnightIso(values.ends_at) : null,
      });
    },
    onSuccess: async () => {
      setSubmitError(null);
      setOpen(false);
      form.reset();
      await qc.invalidateQueries({ queryKey: ["tournaments"] });
    },
    onError: (e: any) => {
      setSubmitError(e?.message ?? "Failed to create tournament");
    },
  });

  const canSubmit = useMemo(() => {
    const values = form.getValues();
    return values.slug.trim().length > 0 && values.name.trim().length > 0 && !mutation.isPending;
  }, [form.watch("slug"), form.watch("name"), mutation.isPending]);

  const data: Tournament[] = tournamentsQuery.data?.tournaments ?? [];

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" align="end" mb="lg">
        <div>
          <Title order={1}>{t("landing.title")}</Title>
          <Text c="dimmed">Seasons, divisions, schedule, standings.</Text>
        </div>

        {isGlobalAdmin && (
          <ActionIcon
            size="lg"
            radius="xl"
            variant="filled"
            color="gold"
            onClick={() => setOpen(true)}
            aria-label="Create tournament"
          >
            <IconPlus size={18} />
          </ActionIcon>
        )}
      </Group>

      {tournamentsQuery.isLoading ? (
        <Loader />
      ) : tournamentsQuery.isError ? (
        <Text c="red">Error loading tournaments</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {data.map((t) => (
            <Card
              key={t.id}
              withBorder
              radius="lg"
              padding="lg"
              shadow="sm"
              onClick={() => nav(`/t/${t.slug}`)}
              style={{ cursor: "pointer" }}
            >
              <Group justify="space-between" mb="xs">
                <Title order={3}>{t.name}</Title>
                <Badge color={t.status === "active" ? "gold" : "redleague"} variant="light">
                  {t.status}
                </Badge>
              </Group>
              <Text c="dimmed" size="sm" lineClamp={3}>
                {t.description || "—"}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Modal opened={open} onClose={() => setOpen(false)} title="Create tournament" centered>
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <Stack gap="sm">
            <TextInput
              label="Slug"
              placeholder="season-12"
              description="Unique identifier used in URLs"
              required
              {...form.register("slug")}
              error={form.formState.errors.slug?.message}
            />

            <TextInput
              label="Name"
              placeholder="Season 12"
              required
              {...form.register("name")}
              error={form.formState.errors.name?.message}
            />

            <Textarea
              label="Description"
              minRows={3}
              placeholder="Optional description"
              {...form.register("description")}
              error={form.formState.errors.description?.message}
            />

            <Group grow>
              <Controller
                control={form.control}
                name="starts_at"
                render={({ field }) => (
                  <DateInput
                    label="Start date"
                    value={field.value}
                    onChange={field.onChange}
                    clearable
                    valueFormat="YYYY-MM-DD"
                    placeholder="YYYY-MM-DD"
                  />
                )}
              />

              <Controller
                control={form.control}
                name="ends_at"
                render={({ field }) => (
                  <DateInput
                    label="End date"
                    value={field.value}
                    onChange={field.onChange}
                    clearable
                    valueFormat="YYYY-MM-DD"
                    placeholder="YYYY-MM-DD"
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
              <Button variant="subtle" onClick={() => setOpen(false)}>
                Cancel
              </Button>

              <Button color="gold" loading={mutation.isPending} disabled={!canSubmit} type="submit">
                Create
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}