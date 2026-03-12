import type { TournamentStatus } from "../api/schemas/statuses";
import type { useI18n } from "../i18n/I18nProvider";

type TFunction = ReturnType<typeof useI18n>["t"];

export function getTournamentStatusMeta(
  status: TournamentStatus,
  t: TFunction,
) {
  switch (status) {
    case "active":
      return {
        label: t("tournament.status.active"),
        color: "gold",
      };

    case "signup":
      return {
        label: t("tournament.status.signup"),
        color: "blue",
      };

    case "completed":
      return {
        label: t("tournament.status.completed"),
        color: "gray",
      };

    case "archived":
      return {
        label: t("tournament.status.archived"),
        color: "gray",
      };

    case "draft":
    default:
      return {
        label: t("tournament.status.draft"),
        color: "redleague",
      };
  }
}