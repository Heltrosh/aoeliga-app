import { useMemo, useState } from "react";
import {
  ActionIcon,
  Box,
  Collapse,
  Group,
  Loader,
  SimpleGrid,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconChevronDown, IconChevronUp, IconPlus } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../auth/AuthContext";
import { useI18n } from "../../../i18n/I18nProvider";
import { useLandingPage } from "../../../hooks/useLandingPage";
import type { TournamentListItem } from "../../../api/schemas/tournaments";
import { CreateTournamentModal } from "./CreateTournamentModal";
import { EditTournamentModal } from "./EditTournamentModal";
import { TournamentCard } from "./TournamentCard";
import { LandingShell } from "../LandingShell";
import { getLandingNavigationAccess } from "../landingAccess";
import { AppSurface } from "../../../components/common/AppSurface";

export default function LandingPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { tournamentsQuery, deleteTournamentMutation } = useLandingPage();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingTournament, setEditingTournament] =
    useState<TournamentListItem | null>(null);

  const tournaments = tournamentsQuery.data?.tournaments ?? [];
  const { isGlobalAdmin, canSeeRulesets, canSeeAdmin } =
    getLandingNavigationAccess(user, tournaments);

  const activeTournaments = useMemo(
    () => tournaments.filter((tournament) => tournament.status !== "archived"),
    [tournaments],
  );
  const [archivedOpened, setArchivedOpened] = useState(false);
  const archivedTournaments = useMemo(
    () => tournaments.filter((tournament) => tournament.status === "archived"),
    [tournaments],
  );

  function handleOpenTournament(slug: string) {
    nav(`/t/${slug}/dashboard`);
  }

  function handleEditTournament(tournament: TournamentListItem) {
    setEditingTournament(tournament);
  }

  async function handleDeleteTournament(slug: string) {
    const confirmed = window.confirm(t("landing.deleteTournament.confirm"));
    if (!confirmed) return;

    try {
      await deleteTournamentMutation.mutateAsync(slug);
    } catch {
      // add notification later if needed
    }
  }

  return (
    <LandingShell
      section="tournaments"
      canSeeRulesets={canSeeRulesets}
      canSeeAdmin={canSeeAdmin}
      rightSlot={
        isGlobalAdmin ? (
          <Tooltip label={t("landing.createTournament.tooltip")} position="bottom">
            <ActionIcon
              size="lg"
              radius="xl"
              variant="filled"
              color="gold"
              onClick={() => setCreateOpen(true)}
              aria-label={t("landing.createTournament.tooltip")}
            >
              <IconPlus size={18} />
            </ActionIcon>
          </Tooltip>
        ) : null
      }
    >
      {tournamentsQuery.isLoading ? (
        <Loader />
      ) : tournamentsQuery.isError ? (
        <Text c="red">{t("landing.errors.loadTournaments")}</Text>
      ) : (
        <>
          {activeTournaments.length === 0 ? (
            <Text c="dimmed">{t("landing.empty")}</Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mb="xl">
              {activeTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onOpen={handleOpenTournament}
                  onEdit={handleEditTournament}
                  onDelete={handleDeleteTournament}
                />
              ))}
            </SimpleGrid>
          )}

          {archivedTournaments.length > 0 && (
            <AppSurface p="lg">
              <Group
                justify="space-between"
                align="center"
                style={{ cursor: "pointer" }}
                onClick={() => setArchivedOpened((current) => !current)}
              >
                <Text fw={700}>
                  {t("landing.archived.sectionTitle")} ({archivedTournaments.length})
                </Text>

                <ActionIcon
                  variant="subtle"
                  color="gold"
                  aria-label={
                    archivedOpened
                      ? t("landing.archived.collapse")
                      : t("landing.archived.expand")
                  }
                >
                  {archivedOpened ? (
                    <IconChevronUp size={18} />
                  ) : (
                    <IconChevronDown size={18} />
                  )}
                </ActionIcon>
              </Group>

              <Collapse in={archivedOpened}>
                <Box mt="md">
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    {archivedTournaments.map((tournament) => (
                      <TournamentCard
                        key={tournament.id}
                        tournament={tournament}
                        onOpen={handleOpenTournament}
                        onEdit={handleEditTournament}
                        onDelete={handleDeleteTournament}
                      />
                    ))}
                  </SimpleGrid>
                </Box>
              </Collapse>
            </AppSurface>
          )}
        </>
      )}

      {isGlobalAdmin && (
        <CreateTournamentModal
          opened={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}

      <EditTournamentModal
        tournament={editingTournament}
        opened={editingTournament !== null}
        onClose={() => setEditingTournament(null)}
      />
    </LandingShell>
  );
}