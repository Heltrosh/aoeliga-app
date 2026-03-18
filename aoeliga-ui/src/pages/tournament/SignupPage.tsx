import { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppSurface } from "../../components/common/AppSurface";
import { useTournament } from "../../hooks/useTournament";
import { useTournamentAccess } from "../../hooks/useTournamentAccess";
import { useAuth } from "../../auth/AuthContext";
import { tournamentKeys } from "../../api/queryKeys";
import {
  createMyTournamentRegistration,
  getMyTournamentRegistration,
  getTournamentRegistrations,
  refreshAllTournamentRegistrations,
  refreshTournamentRegistration,
  reviewTournamentRegistration,
  updateMyTournamentRegistration,
  updateTournamentRegistrationSettings,
  withdrawMyTournamentRegistration,
} from "../../api/tournaments";
import type { StaffTournamentRegistration } from "../../api/schemas/tournaments";

function registrationStatusColor(status: string) {
  switch (status) {
    case "approved":
      return "green";
    case "rejected":
      return "red";
    case "withdrawn":
      return "gray";
    default:
      return "yellow";
  }
}

export default function SignupPage() {
  const { tournament } = useTournament();
  const access = useTournamentAccess();
  const { user } = useAuth();
  const qc = useQueryClient();

  const slug = tournament?.slug ?? "";

  const [aoeUrl, setAoeUrl] = useState("");
  const [note, setNote] = useState("");
  const [reviewModal, setReviewModal] = useState<StaffTournamentRegistration | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"pending" | "approved" | "rejected">("approved");
  const [reviewNote, setReviewNote] = useState("");
  const [settingsOpenValue, setSettingsOpenValue] = useState<boolean>(
    (tournament?.registrations_open ?? 0) === 1,
  );
  const [settingsRecentDays, setSettingsRecentDays] = useState<number | null>(
    tournament?.recent_games_days ?? null,
  );

  const isStaff = access.isTournamentAdmin || access.isTournamentModerator;
  const showSelfSection = !!user;
  const showStaffSection = isStaff;

  const selfRegistrationQuery = useQuery({
    queryKey: tournamentKeys.registrationMe(slug),
    queryFn: () => getMyTournamentRegistration(slug),
    enabled: !!slug && showSelfSection,
  });

  const registrationsQuery = useQuery({
    queryKey: tournamentKeys.registrations(slug),
    queryFn: () => getTournamentRegistrations(slug),
    enabled: !!slug && showStaffSection,
  });

  const saveMyRegistrationMutation = useMutation({
    mutationFn: async () => {
      if (!selfRegistrationQuery.data?.registration) {
        return createMyTournamentRegistration(slug, {
          aoe2insights_url: aoeUrl,
          note: note || null,
        });
      }

      return updateMyTournamentRegistration(slug, {
        aoe2insights_url: aoeUrl,
        note: note || null,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrationMe(slug) });
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrations(slug) });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawMyTournamentRegistration(slug),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrationMe(slug) });
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrations(slug) });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      targetUserId,
      status,
      review_note,
    }: {
      targetUserId: number;
      status: "pending" | "approved" | "rejected";
      review_note: string | null;
    }) =>
      reviewTournamentRegistration(slug, targetUserId, {
        status,
        review_note,
      }),
    onSuccess: async () => {
      setReviewModal(null);
      setReviewNote("");
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrations(slug) });
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrationMe(slug) });
    },
  });

  const refreshOneMutation = useMutation({
    mutationFn: (targetUserId: number) => refreshTournamentRegistration(slug, targetUserId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrations(slug) });
    },
  });

  const refreshAllMutation = useMutation({
    mutationFn: () => refreshAllTournamentRegistrations(slug),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrations(slug) });
    },
  });

  const settingsMutation = useMutation({
    mutationFn: () =>
      updateTournamentRegistrationSettings(slug, {
        registrations_open: settingsOpenValue,
        recent_games_days: settingsRecentDays,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: tournamentKeys.context(slug) });
      await qc.invalidateQueries({ queryKey: tournamentKeys.all });
    },
  });

  const selfRegistration = selfRegistrationQuery.data?.registration ?? null;
  const selfCapabilities = selfRegistrationQuery.data?.capabilities ?? {
    can_create: false,
    can_edit: false,
    can_withdraw: false,
  };

  const registrations = useMemo(
    () => registrationsQuery.data?.registrations ?? [],
    [registrationsQuery.data],
  );

  const selfSectionTitle = selfRegistration ? "Your registration" : "Sign up";

  if (!tournament) {
    return <Loader />;
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Signup</Title>
        <Text c="dimmed">
          Sign up for {tournament.name} and manage registrations.
        </Text>
      </div>

      {showSelfSection && (
        <AppSurface p="lg">
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Title order={3}>{selfSectionTitle}</Title>
              {selfRegistration ? (
                <Badge color={registrationStatusColor(selfRegistration.status)} variant="light">
                  {selfRegistration.status}
                </Badge>
              ) : null}
            </Group>

            {selfRegistrationQuery.isPending ? (
              <Loader size="sm" />
            ) : (
              <>
                {selfRegistration ? (
                  <Text size="sm" c="dimmed">
                    AoE profile: {selfRegistration.aoe_name} ({selfRegistration.aoe_id})
                  </Text>
                ) : (
                  <Text size="sm" c="dimmed">
                    Submit your AoE2Insights profile and optional note.
                  </Text>
                )}

                <TextInput
                  label="AoE2Insights profile URL"
                  placeholder="https://www.aoe2insights.com/user/13123144/"
                  value={aoeUrl}
                  onChange={(event) => setAoeUrl(event.currentTarget.value)}
                  disabled={!(selfCapabilities.can_create || selfCapabilities.can_edit)}
                />

                <Textarea
                  label="Note"
                  placeholder="Optional note for tournament staff"
                  value={note}
                  onChange={(event) => setNote(event.currentTarget.value)}
                  minRows={4}
                  autosize
                  disabled={!(selfCapabilities.can_create || selfCapabilities.can_edit)}
                />

                <Group justify="flex-end">
                  {selfCapabilities.can_withdraw && (
                    <Button
                      color="red"
                      variant="light"
                      loading={withdrawMutation.isPending}
                      onClick={() => withdrawMutation.mutate()}
                    >
                      Withdraw
                    </Button>
                  )}

                  {(selfCapabilities.can_create || selfCapabilities.can_edit) && (
                    <Button
                      color="gold"
                      loading={saveMyRegistrationMutation.isPending}
                      onClick={() => saveMyRegistrationMutation.mutate()}
                    >
                      {selfRegistration ? "Save changes" : "Sign up"}
                    </Button>
                  )}
                </Group>
              </>
            )}
          </Stack>
        </AppSurface>
      )}

      {showStaffSection && (
        <>
          <AppSurface p="lg">
            <Stack gap="md">
              <Title order={3}>Registration settings</Title>

              <Group grow align="flex-end">
                <NumberInput
                  label="Recent games days"
                  min={1}
                  value={settingsRecentDays ?? undefined}
                  onChange={(value) =>
                    setSettingsRecentDays(typeof value === "number" ? value : null)
                  }
                />

                <Button
                  color={settingsOpenValue ? "red" : "green"}
                  variant="light"
                  onClick={() => setSettingsOpenValue((current) => !current)}
                >
                  {settingsOpenValue ? "Set closed" : "Set open"}
                </Button>

                <Button
                  color="gold"
                  loading={settingsMutation.isPending}
                  onClick={() => settingsMutation.mutate()}
                >
                  Save settings
                </Button>
              </Group>

              <Text size="sm" c="dimmed">
                Current: registrations {tournament.registrations_open === 1 ? "open" : "closed"}
                {tournament.recent_games_days ? ` • recent games window ${tournament.recent_games_days} days` : ""}
              </Text>
            </Stack>
          </AppSurface>

          <AppSurface p="lg">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title order={3}>Registrations</Title>
                <Button
                  variant="light"
                  color="gold"
                  loading={refreshAllMutation.isPending}
                  onClick={() => refreshAllMutation.mutate()}
                >
                  Refresh all current data
                </Button>
              </Group>

              {registrationsQuery.isPending ? (
                <Loader />
              ) : registrationsQuery.isError ? (
                <Alert color="red" variant="light">
                  Failed to load registrations.
                </Alert>
              ) : (
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>User</Table.Th>
                      <Table.Th>AoE</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>1v1</Table.Th>
                      <Table.Th>Max</Table.Th>
                      <Table.Th>Games</Table.Th>
                      <Table.Th>Recent</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {registrations.map((item) => (
                      <Table.Tr key={item.id}>
                        <Table.Td>
                          <Text fw={600}>
                            {item.user.display_name || item.user.discord_name || `User #${item.user.id}`}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {item.user.discord_name ?? "—"}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Text fw={600}>{item.aoe_name}</Text>
                          <Text size="sm" c="dimmed">{item.aoe_id}</Text>
                        </Table.Td>

                        <Table.Td>
                          <Badge color={registrationStatusColor(item.status)} variant="light">
                            {item.status}
                          </Badge>
                        </Table.Td>

                        <Table.Td>{item.current_rating ?? "—"}</Table.Td>
                        <Table.Td>{item.current_max_rating ?? "—"}</Table.Td>
                        <Table.Td>{item.total_games ?? "—"}</Table.Td>
                        <Table.Td>{item.recent_games ?? "—"}</Table.Td>

                        <Table.Td>
                          <Group gap="xs">
                            <Button
                              size="xs"
                              variant="light"
                              onClick={() => {
                                setReviewModal(item);
                                setReviewStatus(
                                  item.status === "withdrawn" ? "pending" : item.status,
                                );
                                setReviewNote(item.review_note ?? "");
                              }}
                            >
                              Review
                            </Button>

                            <Button
                              size="xs"
                              variant="light"
                              onClick={() => refreshOneMutation.mutate(item.user_id)}
                              loading={
                                refreshOneMutation.isPending &&
                                refreshOneMutation.variables === item.user_id
                              }
                            >
                              Refresh
                            </Button>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Stack>
          </AppSurface>
        </>
      )}

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
    </Stack>
  );
}