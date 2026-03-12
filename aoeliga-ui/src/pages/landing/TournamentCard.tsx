import { useState } from "react";
import { ActionIcon, Badge, Card, Group, Text, Title, Box } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";

import { useI18n } from "../../i18n/I18nProvider";
import type { TournamentListItem } from "../../api/schemas/tournaments";
import { getTournamentStatusMeta } from "../../utils/tournamentStatus";

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

  return (
    <Card
      withBorder
      radius="lg"
      padding="lg"
      shadow="sm"
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

      <Group justify="space-between" mb="xs">
        <Title order={3}>{tournament.name}</Title>
        <Badge color={statusMeta.color} variant="light">
          {statusMeta.label}
        </Badge>
      </Group>

      <Text c="dimmed" size="sm" lineClamp={3}>
        {tournament.description || t("common.emptyValue")}
      </Text>
    </Card>
  );
}