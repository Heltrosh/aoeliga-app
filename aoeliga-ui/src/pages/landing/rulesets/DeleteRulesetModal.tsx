import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

import type { RulesetListItem } from "../../../api/schemas/rulesets";

type DeleteRulesetModalProps = {
  opened: boolean;
  onClose: () => void;
  ruleset: RulesetListItem | null;
  deleting: boolean;
  onConfirm: (rulesetId: number) => Promise<unknown>;
};

export function DeleteRulesetModal({
  opened,
  onClose,
  ruleset,
  deleting,
  onConfirm,
}: DeleteRulesetModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete ruleset"
      centered
    >
      {!ruleset ? null : (
        <Stack gap="md">
          <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light">
            This action cannot be undone.
          </Alert>

          <Text size="sm">
            Are you sure you want to delete <strong>{ruleset.name}</strong>?
          </Text>

          <Text size="sm" c="dimmed">
            Usage: {ruleset.usage.tournament_default_count} tournament defaults •{" "}
            {ruleset.usage.division_count} divisions
          </Text>

          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>

            <Button
              color="red"
              loading={deleting}
              onClick={async () => {
                if (!ruleset) return;
                await onConfirm(ruleset.id);
                onClose();
              }}
            >
              Delete ruleset
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}