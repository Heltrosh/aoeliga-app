import { useEffect, useMemo, useState } from "react";
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
import { apiGet, apiPost } from "../api";
import { useAuth } from "../auth/AuthContext";

type Tournament = {
  id: number;
  slug: string;
  name: string;
  status: string;
  description?: string;
};

export default function LandingPage() {
  const nav = useNavigate();
  const { user } = useAuth();

  const isGlobalAdmin = user?.is_admin === 1;

  const [data, setData] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // IMPORTANT: in your Mantine version DateInput uses string values
  // We'll store "YYYY-MM-DD" or null
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  function loadTournaments() {
    setLoading(true);
    apiGet<{ tournaments: Tournament[] }>("/api/tournaments")
      .then((r) => setData(r.tournaments))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTournaments();
  }, []);

  const canSubmit = useMemo(() => {
    return slug.trim().length > 0 && name.trim().length > 0 && !saving;
  }, [slug, name, saving]);

  function ymdToMidnightIso(ymd: string): string {
    // ymd is "YYYY-MM-DD"
    // Store as local midnight, then toISOString (UTC)
    const [y, m, d] = ymd.split("-").map((x) => Number(x));
    const local = new Date(y, m - 1, d, 0, 0, 0, 0);
    return local.toISOString();
  }

  async function createTournament() {
    setSaving(true);
    setError(null);

    try {
      const body = {
        slug: slug.trim(),
        name: name.trim(),
        description: description.trim() || null,
        starts_at: startDate ? ymdToMidnightIso(startDate) : null,
        ends_at: endDate ? ymdToMidnightIso(endDate) : null,
      };

      // Use whatever route you actually mounted for this (keeping your earlier path)
      await apiPost("/api/admin/tournaments", body);

      setOpen(false);
      setSlug("");
      setName("");
      setDescription("");
      setStartDate(null);
      setEndDate(null);

      loadTournaments();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create tournament");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" align="end" mb="lg">
        <div>
          <Title order={1}>CZ/SK AoE Liga</Title>
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

      {loading ? (
        <Loader />
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
        <Stack gap="sm">
          <TextInput
            label="Slug"
            placeholder="season-12"
            description="Unique identifier used in URLs"
            value={slug}
            onChange={(e) => setSlug(e.currentTarget.value)}
            required
          />

          <TextInput
            label="Name"
            placeholder="Season 12"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
          />

          <Textarea
            label="Description"
            minRows={3}
            placeholder="Optional description"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />

          <Group grow>
            <DateInput
              label="Start date"
              value={startDate}
              onChange={setStartDate}
              clearable
              valueFormat="YYYY-MM-DD"
              placeholder="YYYY-MM-DD"
            />

            <DateInput
              label="End date"
              value={endDate}
              onChange={setEndDate}
              clearable
              valueFormat="YYYY-MM-DD"
              placeholder="YYYY-MM-DD"
              minDate={startDate ?? undefined}
            />
          </Group>

          {error && (
            <Text c="red" size="sm">
              {error}
            </Text>
          )}

          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button color="gold" loading={saving} disabled={!canSubmit} onClick={createTournament}>
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}