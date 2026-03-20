import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Menu,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconChecklist,
  IconColumns,
  IconEye,
  IconRefresh,
} from "@tabler/icons-react";

import { CollapsibleTile } from "../../../components/tournament-admin/shared";
import { useColumnVisibility } from "../../../hooks/useColumnVisibility";
import {
  DEFAULT_COLUMNS,
  OPTIONAL_COLUMNS,
  type RegistrationColumnKey,
} from "./registrationTableConfig";
import type { SignupPageState } from "./useSignupPageState";

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

export function RegistrationsTableSection({
  state,
}: {
  state: SignupPageState;
}) {
  const {
    slug,
    registrations,
    registrationsQuery,
    refreshFeedback,
    refreshAllMutation,
    refreshOneMutation,
    setDetailsModal,
    openReview,
  } = state;

  const { visible, toggle } = useColumnVisibility<RegistrationColumnKey>(
    `registration-columns-${slug}`,
    DEFAULT_COLUMNS,
  );

  return (
    <CollapsibleTile
      title="Registrations"
      subtitle="Review, refresh and inspect tournament registrations."
      defaultOpen
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <div />
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
                {visible.includes("signup_max_team_rating") && (
                  <Table.Th>Signup Team Max</Table.Th>
                )}

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
    </CollapsibleTile>
  );
}