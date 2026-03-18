import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";

import { fetchRulesetById } from "../../../api/rulesets";
import { rulesetKeys } from "../../../api/queryKeys";
import type {
  CreateRulesetInput,
  UpdateRulesetInput,
} from "../../../api/schemas/rulesets";
import { RulesetGuidedEditor } from "../../../components/rulesets/RulesetGuidedEditor";
import { RulesetRawJsonEditor } from "../../../components/rulesets/RulesetRawJsonEditor";
import {
  configToGuidedState,
  guidedStateToConfig,
  makeDefaultGuidedState,
  type EditorMode,
  type GuidedRulesetEditorState,
} from "./rulesetEditorForm";

type RulesetEditorModalProps = {
  opened: boolean;
  onClose: () => void;
  rulesetId: number | null;
  creating: boolean;
  updating: boolean;
  onCreate: (input: CreateRulesetInput) => Promise<unknown>;
  onUpdate: (id: number, input: UpdateRulesetInput) => Promise<unknown>;
};

export function RulesetEditorModal({
  opened,
  onClose,
  rulesetId,
  creating,
  updating,
  onCreate,
  onUpdate,
}: RulesetEditorModalProps) {
  const isEdit = rulesetId != null;

  const [mode, setMode] = useState<EditorMode>("guided");
  const [guidedState, setGuidedState] = useState<GuidedRulesetEditorState>(
    makeDefaultGuidedState(),
  );
  const [rawJson, setRawJson] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const rulesetQuery = useQuery({
    queryKey: rulesetKeys.detail(rulesetId),
    queryFn: () => fetchRulesetById(rulesetId as number),
    enabled: opened && isEdit,
  });

  useEffect(() => {
    if (!opened) return;

    if (!isEdit) {
      const next = makeDefaultGuidedState();
      setGuidedState(next);
      setRawJson(JSON.stringify(guidedStateToConfig(next), null, 2));
      setMode("guided");
      setSubmitError(null);
      return;
    }

    if (rulesetQuery.data) {
      const next = configToGuidedState(
        rulesetQuery.data.name,
        rulesetQuery.data.config,
      );
      setGuidedState(next);
      setRawJson(JSON.stringify(rulesetQuery.data.config, null, 2));
      setMode("guided");
      setSubmitError(null);
    }
  }, [opened, isEdit, rulesetQuery.data]);

  const isSubmitting = creating || updating;

  function handleGuidedChange(next: GuidedRulesetEditorState) {
    setGuidedState(next);
    setRawJson(JSON.stringify(guidedStateToConfig(next), null, 2));
  }

  function handleModeChange(nextMode: string) {
    if (nextMode === "raw") {
      setRawJson(JSON.stringify(guidedStateToConfig(guidedState), null, 2));
      setMode("raw");
      setSubmitError(null);
      return;
    }

    try {
      const parsed = JSON.parse(rawJson);
      const nextGuided = configToGuidedState(guidedState.name, parsed);
      setGuidedState((prev) => ({
        ...nextGuided,
        name: prev.name.trim().length > 0 ? prev.name : nextGuided.name,
      }));
      setMode("guided");
      setSubmitError(null);
    } catch {
      setSubmitError(
        "Raw JSON is not valid. Fix it before switching back to Guided mode.",
      );
    }
  }

  async function handleSubmit() {
    try {
      setSubmitError(null);

      const name = guidedState.name.trim();
      if (!name) {
        setSubmitError("Name is required.");
        return;
      }

      let config: unknown;
      if (mode === "guided") {
        config = guidedStateToConfig(guidedState);
      } else {
        config = JSON.parse(rawJson);
      }

      if (isEdit && rulesetId != null) {
        await onUpdate(rulesetId, { name, config });
      } else {
        await onCreate({ name, config });
      }

      onClose();
    } catch (error: unknown) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save ruleset.",
      );
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? "Edit ruleset" : "Create ruleset"}
      centered
      size="90%"
    >
      {isEdit && rulesetQuery.isPending ? (
        <Stack py="xl" align="center">
          <Text c="dimmed">Loading ruleset…</Text>
        </Stack>
      ) : (
        <Stack gap="md">
          <Group justify="space-between" align="flex-end">
            <TextInput
              label="Ruleset name"
              placeholder="Default League Rules"
              value={guidedState.name}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setGuidedState((prev) => ({
                  ...prev,
                  name: value,
                }));
              }}
              style={{ flex: 1 }}
            />

            <div>
              <Text size="sm" fw={500} mb={6}>
                Editor mode
              </Text>
              <SegmentedControl
                value={mode}
                onChange={handleModeChange}
                data={[
                  { label: "Guided", value: "guided" },
                  { label: "Raw JSON", value: "raw" },
                ]}
              />
            </div>
          </Group>

          <Alert icon={<IconInfoCircle size={16} />} color="gray" variant="light">
            Guided mode is meant for normal admin use. Raw JSON mode is available
            for advanced editing and troubleshooting.
          </Alert>

          {submitError ? (
            <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
              {submitError}
            </Alert>
          ) : null}

          <ScrollArea.Autosize mah="70vh" offsetScrollbars>
            {mode === "guided" ? (
              <RulesetGuidedEditor
                state={guidedState}
                onChange={handleGuidedChange}
              />
            ) : (
              <RulesetRawJsonEditor value={rawJson} onChange={setRawJson} />
            )}
          </ScrollArea.Autosize>

          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>

            <Button color="gold" loading={isSubmitting} onClick={handleSubmit}>
              {isEdit ? "Save changes" : "Create ruleset"}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}