import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Code,
  FileInput,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconCheck, IconUpload } from "@tabler/icons-react";
import { useParams } from "react-router-dom";

import { AppSurface } from "../../components/common/AppSurface";
import { API_BASE } from "../../api/client";
import { useTournament } from "../../hooks/useTournament";

type UploadResult = unknown;

const TEST_MATCH_UNIT_ID = 1;

export default function ReplayTestPage() {
  const { slug } = useParams<{ slug: string }>();
  const { tournament } = useTournament();

  const [file, setFile] = useState<File | null>(null);
  const [skipParse, setSkipParse] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleSubmit() {
    if (!slug) {
      setError("Missing tournament slug.");
      return;
    }

    if (!file) {
      setError("Please choose a replay file.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      if (skipParse) {
        formData.append("skip_parse", "true");
      }

      const response = await fetch(
        `${API_BASE}/api/tournaments/${slug}/match-units/${TEST_MATCH_UNIT_ID}/replays`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof json?.error === "string"
            ? json.error
            : typeof json?.message === "string"
              ? json.message
              : `HTTP ${response.status}`;

        throw new Error(message);
      }

      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Replay upload test</Title>
        <Text c="dimmed">
          Temporary dev page for testing replay upload flow against match unit{" "}
          <Code>{TEST_MATCH_UNIT_ID}</Code>
          {tournament ? ` in ${tournament.name}` : ""}.
        </Text>
      </div>

      <AppSurface p="lg">
        <Stack gap="md">
          <Text size="sm">
            Tournament slug: <Code>{slug ?? "missing"}</Code>
          </Text>

          <Text size="sm">
            Match unit id: <Code>{TEST_MATCH_UNIT_ID}</Code>
          </Text>

          <FileInput
            label="Replay file"
            placeholder="Choose .aoe2record file"
            value={file}
            onChange={setFile}
            clearable
            accept=".aoe2record"
          />

          <Checkbox
            label="Skip parse (admin/staff fallback)"
            checked={skipParse}
            onChange={(event) => setSkipParse(event.currentTarget.checked)}
          />

          <Group justify="flex-start">
            <Button
              leftSection={<IconUpload size={16} />}
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!file}
            >
              Upload replay
            </Button>
          </Group>
        </Stack>
      </AppSurface>

      {error ? (
        <Alert color="red" variant="light" icon={<IconAlertCircle size={18} />}>
          {error}
        </Alert>
      ) : null}

      {result ? (
        <AppSurface p="lg">
          <Stack gap="sm">
            <Group gap="xs">
              <IconCheck size={18} />
              <Text fw={600}>Upload response</Text>
            </Group>

            <Code block>{JSON.stringify(result, null, 2)}</Code>
          </Stack>
        </AppSurface>
      ) : null}
    </Stack>
  );
}