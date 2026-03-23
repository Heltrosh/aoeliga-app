import { Button, Group, Modal, Stack, Text, Textarea } from "@mantine/core";

import { useI18n } from "../../../i18n/I18nProvider";
import type { SignupPageState } from "./useSignupPageState";

export function ReviewModal({
  state,
}: {
  state: SignupPageState;
}) {
  const { t } = useI18n();

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
      title={t("tournament.signup.review.title")}
      centered
    >
      <Stack gap="md">
        <Text fw={600}>
          {reviewModal?.user.display_name ||
            reviewModal?.user.discord_name}
        </Text>

        <Group>
          <Button
            variant={reviewStatus === "pending" ? "filled" : "light"}
            onClick={() => setReviewStatus("pending")}
          >
            {t("tournament.signup.status.pending")}
          </Button>
          <Button
            color="green"
            variant={reviewStatus === "approved" ? "filled" : "light"}
            onClick={() => setReviewStatus("approved")}
          >
            {t("tournament.signup.review.approve")}
          </Button>
          <Button
            color="red"
            variant={reviewStatus === "rejected" ? "filled" : "light"}
            onClick={() => setReviewStatus("rejected")}
          >
            {t("tournament.signup.review.reject")}
          </Button>
        </Group>

        <Textarea
          label={t("tournament.signup.review.note")}
          value={reviewNote}
          onChange={(event) => setReviewNote(event.currentTarget.value)}
          autosize
          minRows={4}
        />

        <Group justify="flex-end">
          <Button variant="subtle" onClick={() => setReviewModal(null)}>
            {t("common.cancel")}
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
            {t("tournament.signup.review.save")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}