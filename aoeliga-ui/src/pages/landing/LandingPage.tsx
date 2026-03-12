import { useMemo, useState } from "react";
import {
  Accordion,
  ActionIcon,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Text,
  Title,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import { useI18n } from "../../i18n/I18nProvider";
import { useLandingPage } from "../../hooks/useLandingPage";
import type { TournamentListItem } from "../../api/schemas/tournaments";
import { CreateTournamentModal } from "./CreateTournamentModal";
import { EditTournamentModal } from "./EditTournamentModal";
import { TournamentCard } from "./TournamentCard";

export default function LandingPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { tournamentsQuery, deleteTournamentMutation } = useLandingPage();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingTournament, setEditingTournament] =
    useState<TournamentListItem | null>(null);

  const isGlobalAdmin = user?.is_admin === 1;
  const tournaments = tournamentsQuery.data?.tournaments ?? [];

  const activeTournaments = useMemo(
    () => tournaments.filter((tournament) => tournament.status !== "archived"),
    [tournaments],
  );

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
    <Container size="lg" py="xl">
      <Group justify="space-between" align="end" mb="lg">
        <div>
          <Title order={1}>{t("landing.title")}</Title>
        </div>

        {isGlobalAdmin && (
          <ActionIcon
            size="lg"
            radius="xl"
            variant="filled"
            color="gold"
            onClick={() => setCreateOpen(true)}
            aria-label={t("landing.createTournament.openAriaLabel")}
          >
            <IconPlus size={18} />
          </ActionIcon>
        )}
      </Group>

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
            <Accordion variant="separated">
              <Accordion.Item value="archived">
                <Accordion.Control>
                  {t("landing.archived.sectionTitle")} ({archivedTournaments.length})
                </Accordion.Control>

                <Accordion.Panel>
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
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
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
    </Container>
  );
}