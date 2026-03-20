import { Modal, Stack, Text } from "@mantine/core";

import type { SignupPageState } from "./useSignupPageState";

export function DetailsModal({
  state,
}: {
  state: SignupPageState;
}) {
  const { detailsModal, setDetailsModal } = state;

  return (
    <Modal
      opened={!!detailsModal}
      onClose={() => setDetailsModal(null)}
      title="Registration details"
      size="lg"
    >
      {detailsModal && (
        <Stack gap="xs">
          <Text>
            <b>User:</b>{" "}
            {detailsModal.user.display_name ||
              detailsModal.user.discord_name ||
              `User #${detailsModal.user.id}`}
          </Text>
          <Text>
            <b>Discord:</b> {detailsModal.user.discord_name ?? "—"}
          </Text>
          <Text>
            <b>AoE:</b> {detailsModal.aoe_name} ({detailsModal.aoe_id})
          </Text>
          <Text>
            <b>Status:</b> {detailsModal.status}
          </Text>
          <Text>
            <b>Submitted:</b> {detailsModal.submitted_at}
          </Text>
          <Text>
            <b>Updated:</b> {detailsModal.updated_at ?? "—"}
          </Text>
          <Text>
            <b>Reviewed at:</b> {detailsModal.reviewed_at ?? "—"}
          </Text>
          <Text>
            <b>Reviewed by:</b> {detailsModal.reviewed_by ?? "—"}
          </Text>
          <Text>
            <b>Note:</b> {detailsModal.note ?? "—"}
          </Text>
          <Text>
            <b>Review note:</b> {detailsModal.review_note ?? "—"}
          </Text>
        </Stack>
      )}
    </Modal>
  );
}