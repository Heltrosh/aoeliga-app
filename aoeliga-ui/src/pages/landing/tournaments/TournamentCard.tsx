import { useEffect, useState, useRef } from "react";
import { ActionIcon, Badge, Box, Group, Text, Title, Tooltip } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";

import { AppSurface } from "../../../components/common/AppSurface";
import { useI18n } from "../../../i18n/I18nProvider";
import type { TournamentListItem } from "../../../api/schemas/tournaments";
import { getTournamentStatusMeta } from "../../../utils/tournamentStatus";

type TournamentCardProps = {
  tournament: TournamentListItem;
  onOpen: (slug: string) => void;
  onEdit: (tournament: TournamentListItem) => void;
  onDelete: (slug: string) => void;
};

export function TournamentCard({
  tournament,
  onOpen,
  onEdit,
  onDelete,
}: TournamentCardProps) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState(false);

  const statusMeta = getTournamentStatusMeta(tournament.status, t);
  const canEdit = tournament.capabilities.can_edit;
  const canDelete = tournament.capabilities.can_delete;
  const showActions = canEdit || canDelete;

  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const descriptionRef = useRef<HTMLDivElement | null>(null);

  const [isTitleTruncated, setIsTitleTruncated] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);

  useEffect(() => {
    const titleEl = titleRef.current;
    const descriptionEl = descriptionRef.current;

    const check = () => {
      if (titleEl) {
        setIsTitleTruncated(titleEl.scrollWidth > titleEl.clientWidth);
      }

      if (descriptionEl) {
        setIsDescriptionTruncated(descriptionEl.scrollWidth > descriptionEl.clientWidth);
      }
    };

    requestAnimationFrame(check);

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(check) : null;

    if (titleEl && resizeObserver) {
      resizeObserver.observe(titleEl);
    }

    if (descriptionEl && resizeObserver) {
      resizeObserver.observe(descriptionEl);
    }

    window.addEventListener("resize", check);

    return () => {
      window.removeEventListener("resize", check);
      resizeObserver?.disconnect();
    };
  }, [tournament.name, tournament.description]);

  return (
    <AppSurface
      variant="card"
      p="lg"
      onClick={() => onOpen(tournament.slug)}
      style={{
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showActions && (
        <Box
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 3,
            display: "flex",
            gap: 6,
            opacity: hovered ? 1 : 0,
            pointerEvents: hovered ? "auto" : "none",
            transition: "opacity 120ms ease",
            background: "rgba(17, 24, 39, 0.78)",
            borderRadius: 10,
            padding: 4,
            backdropFilter: "blur(6px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {canEdit && (
            <ActionIcon
              variant="subtle"
              color="blue"
              aria-label={t("landing.tournament.actions.edit")}
              onClick={() => onEdit(tournament)}
            >
              <IconEdit size={16} />
            </ActionIcon>
          )}

          {canDelete && (
            <ActionIcon
              variant="subtle"
              color="red"
              aria-label={t("landing.tournament.actions.delete")}
              onClick={() => onDelete(tournament.slug)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          )}
        </Box>
      )}

      <Group justify="space-between" align="flex-start" mb="xs" wrap="nowrap">
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Tooltip label={tournament.name} disabled={!isTitleTruncated} multiline maw={320}>
            <Title
              ref={titleRef}
              order={3}
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {tournament.name}
            </Title>
          </Tooltip>
        </Box>

        <Badge color={statusMeta.color} variant="light" style={{ flexShrink: 0 }}>
          {statusMeta.label}
        </Badge>
      </Group>

      <Tooltip
        label={tournament.description || t("common.emptyValue")}
        disabled={!isDescriptionTruncated}
        multiline
        maw={360}
      >
        <Box
          ref={descriptionRef}
          style={{
            minWidth: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <Text c="dimmed" size="sm" span>
            {tournament.description || t("common.emptyValue")}
          </Text>
        </Box>
      </Tooltip>
    </AppSurface>
  );
}