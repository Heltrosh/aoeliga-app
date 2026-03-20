import { Button, Group, Modal, Stack, Text, Textarea } from "@mantine/core";

import type { SignupPageState } from "./useSignupPageState";

export function ReviewModal({
  state,
}: {
  state: SignupPageState;
}) {
  const {
    reviewModal,
    setReviewModal,
    reviewStatus,
    setReviewStatus,
    reviewNote,
    setReviewNote,
    reviewMutation,
  } = state;

  return (
    <Modal
      opened={reviewModal != null}
      onClose={() => setReviewModal(null)}
      title="Review registration"
      centered
    >
      <Stack gap="md">
        <Text fw={600}>
          {reviewModal?.user.display_name || reviewModal?.user.discord_name || "User"}
        </Text>

        <Group>
          <Button
            variant={reviewStatus === "pending" ? "filled" : "light"}
            onClick={() => setReviewStatus("pending")}
          >
            Pending
          </Button>
          <Button
            color="green"
            variant={reviewStatus === "approved" ? "filled" : "light"}
            onClick={() => setReviewStatus("approved")}
          >
            Approve
          </Button>
          <Button
            color="red"
            variant={reviewStatus === "rejected" ? "filled" : "light"}
            onClick={() => setReviewStatus("rejected")}
          >
            Reject
          </Button>
        </Group>

        <Textarea
          label="Review note"
          value={reviewNote}
          onChange={(event) => setReviewNote(event.currentTarget.value)}
          autosize
          minRows={4}
        />

        <Group justify="flex-end">
          <Button variant="subtle" onClick={() => setReviewModal(null)}>
            Cancel
          </Button>
          <Button
            color="gold"
            loading={reviewMutation.isPending}
            onClick={() => {
              if (!reviewModal) return;
              reviewMutation.mutate({
                targetUserId: reviewModal.user_id,
                status: reviewStatus,
                review_note: reviewNote.trim() || null,
              });
            }}
          >
            Save review
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}