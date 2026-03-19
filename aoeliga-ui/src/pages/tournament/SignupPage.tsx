import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Menu,
  Modal,
  NumberInput,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconChecklist,
  IconColumns,
  IconEye,
  IconRefresh,
} from "@tabler/icons-react";

import { AppSurface } from "../../components/common/AppSurface";
import { useTournament } from "../../hooks/useTournament";
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
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
import {
  DEFAULT_COLUMNS,
  OPTIONAL_COLUMNS,
  type RegistrationColumnKey,
} from "./signup/registrationTableConfig";

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
  const [detailsModal, setDetailsModal] = useState<StaffTournamentRegistration | null>(null);
  const [refreshFeedback, setRefreshFeedback] = useState<string | null>(null);
  
  const [isReRegistering, setIsReRegistering] = useState(false);

  const { visible, toggle } = useColumnVisibility<RegistrationColumnKey>(
    `registration-columns-${slug}`,
    DEFAULT_COLUMNS,
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

  useEffect(() => {
    const registration = selfRegistrationQuery.data?.registration;

    if (!registration) {
      setAoeUrl("");
      setNote("");
      setIsReRegistering(false);
      return;
    }

    setNote(registration.note ?? "");
    setAoeUrl(`https://www.aoe2companion.com/players/${registration.aoe_id}`);
    setIsReRegistering(false);
  }, [selfRegistrationQuery.data?.registration]);

  useEffect(() => {
    if (!refreshFeedback) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setRefreshFeedback(null);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [refreshFeedback]);

  function openReview(item: StaffTournamentRegistration) {
    setReviewModal(item);
    setReviewStatus(item.status === "withdrawn" ? "pending" : item.status);
    setReviewNote(item.review_note ?? "");
  }

  const saveMyRegistrationMutation = useMutation({
    mutationFn: async () => {
      if (isCreateMode) {
        return createMyTournamentRegistration(slug, {
          aoe2companion_url: aoeUrl,
          note: note || null,
        });
      }

      return updateMyTournamentRegistration(slug, {
        aoe2companion_url: aoeUrl,
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
      setRefreshFeedback("Registration review saved.");
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrations(slug) });
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrationMe(slug) });
    },
  });

  const refreshOneMutation = useMutation({
    mutationFn: (targetUserId: number) => refreshTournamentRegistration(slug, targetUserId),
    onSuccess: async (_, targetUserId) => {
      setRefreshFeedback(`Registration #${targetUserId} refreshed.`);
      await qc.invalidateQueries({ queryKey: tournamentKeys.registrations(slug) });
    },
  });

  const refreshAllMutation = useMutation({
    mutationFn: () => refreshAllTournamentRegistrations(slug),
    onSuccess: async () => {
      setRefreshFeedback("All registrations refreshed.");
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

  const selfStatus = selfRegistration?.status ?? null;
  const canReRegister =
    selfStatus === "rejected" || selfStatus === "withdrawn";

  const isCreateMode =
    !selfRegistration || isReRegistering;

  const isEditableForm =
    isCreateMode || selfCapabilities.can_edit;

  const registrations = useMemo(
    () => registrationsQuery.data?.registrations ?? [],
    [registrationsQuery.data],
  );

const selfSectionTitle = isCreateMode ? "Sign up" : "Your registration";

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
              {selfRegistration && !isCreateMode ? (
                <Badge color={registrationStatusColor(selfRegistration.status)} variant="light">
                  {selfRegistration.status}
                </Badge>
              ) : null}
            </Group>

            {selfRegistrationQuery.isPending ? (
              <Loader size="sm" />
            ) : (
              <>
                {selfRegistration && !isCreateMode ? (
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">
                      AoE profile: {selfRegistration.aoe_name} ({selfRegistration.aoe_id})
                    </Text>

                    {selfRegistration.status === "rejected" ? (
                      <Alert color="red" variant="light">
                        Your registration was rejected.
                      </Alert>
                    ) : null}

                    {selfRegistration.status === "withdrawn" ? (
                      <Alert color="gray" variant="light">
                        You have withdrawn your registration.
                      </Alert>
                    ) : null}
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    Submit your AoE2Companion profile and optional note.
                  </Text>
                )}

                <TextInput
                  label="AoE2Companion profile URL"
                  placeholder="https://www.aoe2companion.com/players/2047125"
                  value={aoeUrl}
                  onChange={(event) => setAoeUrl(event.currentTarget.value)}
                  disabled={!isEditableForm}
                />

                <Textarea
                  label="Note"
                  placeholder="Optional note for tournament staff"
                  value={note}
                  onChange={(event) => setNote(event.currentTarget.value)}
                  minRows={4}
                  autosize
                  disabled={!isEditableForm}
                />

                <Group justify="flex-end">
                  {canReRegister && !isReRegistering ? (
                    <Button
                      color="gold"
                      onClick={() => {
                        setIsReRegistering(true);
                      }}
                    >
                      Register again
                    </Button>
                  ) : null}

                  {selfCapabilities.can_withdraw && !isCreateMode ? (
                    <Button
                      color="red"
                      variant="light"
                      loading={withdrawMutation.isPending}
                      onClick={() => withdrawMutation.mutate()}
                    >
                      Withdraw
                    </Button>
                  ) : null}

                  {isEditableForm ? (
                    <Button
                      color="gold"
                      loading={saveMyRegistrationMutation.isPending}
                      onClick={() => saveMyRegistrationMutation.mutate()}
                    >
                      {isCreateMode ? "Sign up" : "Save changes"}
                    </Button>
                  ) : null}

                  {isReRegistering ? (
                    <Button
                      variant="subtle"
                      onClick={() => {
                        setIsReRegistering(false);
                        if (selfRegistration) {
                          setNote(selfRegistration.note ?? "");
                          setAoeUrl(`https://www.aoe2companion.com/players/${selfRegistration.aoe_id}`);
                        } else {
                          setNote("");
                          setAoeUrl("");
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null}
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
                {tournament.recent_games_days
                  ? ` • recent games window ${tournament.recent_games_days} days`
                  : ""}
              </Text>
            </Stack>
          </AppSurface>

          <AppSurface p="lg">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title order={3}>Registrations</Title>

                <Group>
                  <Menu shadow="md">
                    <Menu.Target>
                      <Button size="xs" variant="light" leftSection={<IconColumns size={14} />}>
                        Columns
                      </Button>
                    </Menu.Target>

                    <Menu.Dropdown>
                      {OPTIONAL_COLUMNS.map((col) => (
                        <Menu.Item
                          key={col.key}
                          onClick={() => toggle(col.key)}
                          rightSection={visible.includes(col.key) ? "✓" : ""}
                        >
                          {col.label}
                        </Menu.Item>
                      ))}
                    </Menu.Dropdown>
                  </Menu>

                  <Button
                    size="xs"
                    variant="light"
                    loading={refreshAllMutation.isPending}
                    onClick={() => refreshAllMutation.mutate()}
                  >
                    Refresh all
                  </Button>
                </Group>
              </Group>

              {refreshFeedback ? (
                <Alert color="green" variant="light">
                  {refreshFeedback}
                </Alert>
              ) : null}

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
                      {visible.includes("user") && <Table.Th>User</Table.Th>}
                      {visible.includes("aoe") && <Table.Th>AoE</Table.Th>}
                      {visible.includes("signup_rating") && <Table.Th>Signup</Table.Th>}
                      {visible.includes("signup_max_rating") && <Table.Th>Signup Max</Table.Th>}
                      {visible.includes("signup_team_rating") && <Table.Th>Signup Team</Table.Th>}
                      {visible.includes("signup_max_team_rating") && <Table.Th>Signup Team Max</Table.Th>}

                      {visible.includes("current_rating") && <Table.Th>1v1</Table.Th>}
                      {visible.includes("current_max_rating") && <Table.Th>Max</Table.Th>}
                      {visible.includes("current_team_rating") && <Table.Th>Team</Table.Th>}
                      {visible.includes("current_max_team_rating") && <Table.Th>Team Max</Table.Th>}

                      {visible.includes("total_games") && <Table.Th>Games</Table.Th>}
                      {visible.includes("recent_games") && <Table.Th>Recent</Table.Th>}
                      {visible.includes("status") && <Table.Th>Status</Table.Th>}

                      <Table.Th>Details</Table.Th>
                      {visible.includes("actions") && <Table.Th>Actions</Table.Th>}
                    </Table.Tr>
                  </Table.Thead>

                  <Table.Tbody>
                    {registrations.map((item) => {
                      const isRefreshingThisRow =
                        refreshOneMutation.isPending &&
                        refreshOneMutation.variables === item.user_id;

                      return (
                        <Table.Tr key={item.id}>
                          {visible.includes("user") && (
                            <Table.Td>
                              <Text fw={600}>
                                {item.user.display_name ||
                                  item.user.discord_name ||
                                  `User #${item.user.id}`}
                              </Text>
                              <Text size="sm" c="dimmed">
                                {item.user.discord_name ?? ""}
                              </Text>
                            </Table.Td>
                          )}

                          {visible.includes("aoe") && (
                            <Table.Td>
                              <Text fw={600}>{item.aoe_name}</Text>
                              <Text size="sm" c="dimmed">
                                {item.aoe_id}
                              </Text>
                            </Table.Td>
                          )}

                          {visible.includes("signup_rating") && (
                            <Table.Td>{item.signup_rating ?? "—"}</Table.Td>
                          )}
                          {visible.includes("signup_max_rating") && (
                            <Table.Td>{item.signup_max_rating ?? "—"}</Table.Td>
                          )}
                          {visible.includes("signup_team_rating") && (
                            <Table.Td>{item.signup_team_rating ?? "—"}</Table.Td>
                          )}
                          {visible.includes("signup_max_team_rating") && (
                            <Table.Td>{item.signup_max_team_rating ?? "—"}</Table.Td>
                          )}

                          {visible.includes("current_rating") && (
                            <Table.Td>{item.current_rating ?? "—"}</Table.Td>
                          )}
                          {visible.includes("current_max_rating") && (
                            <Table.Td>{item.current_max_rating ?? "—"}</Table.Td>
                          )}
                          {visible.includes("current_team_rating") && (
                            <Table.Td>{item.current_team_rating ?? "—"}</Table.Td>
                          )}
                          {visible.includes("current_max_team_rating") && (
                            <Table.Td>{item.current_max_team_rating ?? "—"}</Table.Td>
                          )}

                          {visible.includes("total_games") && (
                            <Table.Td>{item.total_games ?? "—"}</Table.Td>
                          )}
                          {visible.includes("recent_games") && (
                            <Table.Td>{item.recent_games ?? "—"}</Table.Td>
                          )}

                          {visible.includes("status") && (
                            <Table.Td>
                              <Badge color={registrationStatusColor(item.status)} variant="light">
                                {item.status}
                              </Badge>
                            </Table.Td>
                          )}

                          <Table.Td>
                            <Tooltip label="Details">
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
                              <Group gap="xs" wrap="nowrap">
                                <Tooltip label="Review">
                                  <ActionIcon
                                    size="lg"
                                    variant="subtle"
                                    onClick={() => openReview(item)}
                                  >
                                    <IconChecklist size={18} />
                                  </ActionIcon>
                                </Tooltip>

                                <Tooltip label="Refresh">
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
                    })}
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

      <Modal
        opened={!!detailsModal}
        onClose={() => setDetailsModal(null)}
        title="Registration details"
        size="lg"
      >
        {detailsModal && (
          <Stack gap="xs">
            <Text>
              <b>User:</b>{" "}
              {detailsModal.user.display_name ||
                detailsModal.user.discord_name ||
                `User #${detailsModal.user.id}`}
            </Text>
            <Text>
              <b>Discord:</b> {detailsModal.user.discord_name ?? "—"}
            </Text>
            <Text>
              <b>AoE:</b> {detailsModal.aoe_name} ({detailsModal.aoe_id})
            </Text>
            <Text>
              <b>Status:</b> {detailsModal.status}
            </Text>
            <Text>
              <b>Submitted:</b> {detailsModal.submitted_at}
            </Text>
            <Text>
              <b>Updated:</b> {detailsModal.updated_at ?? "—"}
            </Text>
            <Text>
              <b>Reviewed at:</b> {detailsModal.reviewed_at ?? "—"}
            </Text>
            <Text>
              <b>Reviewed by:</b> {detailsModal.reviewed_by ?? "—"}
            </Text>
            <Text>
              <b>Note:</b> {detailsModal.note ?? "—"}
            </Text>
            <Text>
              <b>Review note:</b> {detailsModal.review_note ?? "—"}
            </Text>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}