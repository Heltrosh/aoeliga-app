import {
  ActionIcon,
  Anchor,
  Badge,
  Group,
  Loader,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconChecklist,
  IconEye,
  IconExternalLink,
  IconRefresh,
} from "@tabler/icons-react";

import type { StaffTournamentRegistration } from "../../../../api/schemas/tournaments";
import { useI18n } from "../../../../i18n/I18nProvider";
import type { RegistrationColumnKey } from "../registrationTableConfig";
import { registrationStatusColor } from "./helpers";
import type { SignupPageState } from "../useSignupPageState";

export function RegistrationTableRow({
  item,
  visible,
  refreshOneMutation,
  setDetailsModal,
  openReview,
}: {
  item: StaffTournamentRegistration;
  visible: RegistrationColumnKey[];
  refreshOneMutation: SignupPageState["refreshOneMutation"];
  setDetailsModal: SignupPageState["setDetailsModal"];
  openReview: SignupPageState["openReview"];
}) {
  const { t } = useI18n();

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

  function truncateName(name: string, limit: number) {
  return name.length > limit ? `${name.slice(0, limit)}...` : name;
}

  const isRefreshingThisRow =
    refreshOneMutation.isPending &&
    refreshOneMutation.variables === item.user_id;

  const aoeUrl = `https://www.aoe2companion.com/players/${item.aoe_id}`;
  const centeredCellStyle = { textAlign: "center" as const };

  return (
    <Table.Tr>
      {visible.includes("user") && (
        <Table.Td>
          <Text fw={600}>
            {truncateName(item.user.display_name ?? "", 15)}
          </Text>
          <Text size="sm" c="dimmed">
            {item.user.discord_name ?? ""}
          </Text>
        </Table.Td>
      )}

      {visible.includes("aoe") && (
        <Table.Td>
          <Text fw={600}>{truncateName(item.aoe_name, 10)}</Text>
          <Anchor
            href={aoeUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            AoE2Companion
            <IconExternalLink size={14} />
          </Anchor>
        </Table.Td>
      )}

      {visible.includes("signup_rating") && (
        <Table.Td style={centeredCellStyle}>{item.signup_rating ?? t("common.emptyValue")}</Table.Td>
      )}
      {visible.includes("signup_max_rating") && (
        <Table.Td style={centeredCellStyle}>{item.signup_max_rating ?? t("common.emptyValue")}</Table.Td>
      )}
      {visible.includes("signup_team_rating") && (
        <Table.Td style={centeredCellStyle}>{item.signup_team_rating ?? t("common.emptyValue")}</Table.Td>
      )}
      {visible.includes("signup_max_team_rating") && (
        <Table.Td style={centeredCellStyle}>{item.signup_max_team_rating ?? t("common.emptyValue")}</Table.Td>
      )}

      {visible.includes("current_rating") && (
        <Table.Td style={centeredCellStyle}>{item.current_rating ?? t("common.emptyValue")}</Table.Td>
      )}
      {visible.includes("current_max_rating") && (
        <Table.Td style={centeredCellStyle}>{item.current_max_rating ?? t("common.emptyValue")}</Table.Td>
      )}
      {visible.includes("current_team_rating") && (
        <Table.Td style={centeredCellStyle}>{item.current_team_rating ?? t("common.emptyValue")}</Table.Td>
      )}
      {visible.includes("current_max_team_rating") && (
        <Table.Td style={centeredCellStyle}>{item.current_max_team_rating ?? t("common.emptyValue")}</Table.Td>
      )}

      {visible.includes("total_games") && (
        <Table.Td style={centeredCellStyle}>{item.total_games ?? t("common.emptyValue")}</Table.Td>
      )}
      {visible.includes("recent_games") && (
        <Table.Td style={centeredCellStyle}>{item.recent_games ?? t("common.emptyValue")}</Table.Td>
      )}

      {visible.includes("status") && (
        <Table.Td style={centeredCellStyle}>
          <Badge color={registrationStatusColor(item.status)} variant="light">
            {statusLabel(item.status)}
          </Badge>
        </Table.Td>
      )}

      <Table.Td style={centeredCellStyle}>
        <Tooltip label={t("tournament.signup.table.tooltip.details")}>
          <ActionIcon
            size="lg"
            variant="subtle"
            onClick={() => setDetailsModal(item)}
          >
            <IconEye size={18} />
          </ActionIcon>
        </Tooltip>
      </Table.Td>

      {visible.includes("actions") && (
        <Table.Td>
          <Group gap={2} wrap="nowrap">
            <Tooltip label={t("tournament.signup.table.tooltip.review")}>
              <ActionIcon
                size="lg"
                variant="subtle"
                onClick={() => openReview(item)}
              >
                <IconChecklist size={18} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label={t("tournament.signup.table.tooltip.refresh")}>
              <ActionIcon
                size="lg"
                variant="subtle"
                onClick={() => refreshOneMutation.mutate(item.user_id)}
                disabled={isRefreshingThisRow}
              >
                {isRefreshingThisRow ? (
                  <Loader size={16} />
                ) : (
                  <IconRefresh size={18} />
                )}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      )}
    </Table.Tr>
  );
}