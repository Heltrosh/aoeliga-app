import { Modal, Stack, Text } from "@mantine/core";

import { useI18n } from "../../../i18n/I18nProvider";
import type { SignupPageState } from "./useSignupPageState";

export function DetailsModal({
  state,
}: {
  state: SignupPageState;
}) {
  const { t } = useI18n();
  const { detailsModal, setDetailsModal } = state;

  function statusLabel(status: string) {
    switch (status) {
      case "approved":
        return t("tournament.signup.status.approved");
      case "rejected":
        return t("tournament.signup.status.rejected");
      case "withdrawn":
        return t("tournament.signup.status.withdrawn");
      default:
        return t("tournament.signup.status.pending");
    }
  }

  const empty = t("common.emptyValue");

  return (
    <Modal
      opened={!!detailsModal}
      onClose={() => setDetailsModal(null)}
      title={t("tournament.signup.details.title")}
      size="lg"
    >
      {detailsModal && (
        <Stack gap="xs">
          <Text>
            <b>{t("tournament.signup.details.user")}</b>{" "}
            {detailsModal.user.display_name ||
              detailsModal.user.discord_name}
          </Text>
          <Text>
            <b>{t("tournament.signup.details.discord")}</b> {detailsModal.user.discord_name ?? empty}
          </Text>
          <Text>
            <b>{t("tournament.signup.details.aoe")}</b> {detailsModal.aoe_name} ({detailsModal.aoe_id})
          </Text>
          <Text>
            <b>{t("tournament.signup.details.note")}</b> {detailsModal.note ?? empty}
          </Text>
          <Text>
            <b>{t("tournament.signup.details.status")}</b> {statusLabel(detailsModal.status)}
          </Text>
          <Text>
            <b>{t("tournament.signup.details.submitted")}</b> {detailsModal.submitted_at}
          </Text>
          <Text>
            <b>{t("tournament.signup.details.updated")}</b> {detailsModal.updated_at ?? empty}
          </Text>
          <Text>
            <b>{t("tournament.signup.details.reviewedAt")}</b> {detailsModal.reviewed_at ?? empty}
          </Text>
          <Text>
            <b>{t("tournament.signup.details.reviewedBy")}</b> {detailsModal.reviewed_by ?? empty}
          </Text>
          <Text>
            <b>{t("tournament.signup.details.reviewNote")}</b> {detailsModal.review_note ?? empty}
          </Text>
        </Stack>
      )}
    </Modal>
  );
}