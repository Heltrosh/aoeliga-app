import {
  Alert,
  Button,
  Group,
  Loader,
  Menu,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import {
  IconColumns,
  IconX,
} from "@tabler/icons-react";

import { CollapsibleTile } from "../../../components/tournament-admin/shared";
import { useColumnVisibility } from "../../../hooks/useColumnVisibility";
import { useI18n } from "../../../i18n/I18nProvider";
import {
  DEFAULT_COLUMNS,
  OPTIONAL_COLUMNS,
  type RegistrationColumnKey,
} from "./registrationTableConfig";
import type { SignupPageState } from "./useSignupPageState";
import {
  RegistrationTableHeaderCell,
  NumericFilterPopover,
  StatusFilterPopover,
} from "./registrationsTable/RegistrationTableHeaderCell";
import { RegistrationTableRow } from "./registrationsTable/RegistrationTableRow";
import { useRegistrationsTable } from "./registrationsTable/useRegistrationsTable";

export function RegistrationsTableSection({
  state,
}: {
  state: SignupPageState;
}) {
  const { t } = useI18n();

  const {
    slug,
    registrations,
    registrationsQuery,
    tableFeedback,
    refreshAllMutation,
    refreshOneMutation,
    setDetailsModal,
    openReview,
  } = state;

  const { visible, toggle } = useColumnVisibility<RegistrationColumnKey>(
    `registration-columns-${slug}`,
    DEFAULT_COLUMNS,
  );

  const {
    sortKey,
    sortDirection,
    statusFilter,
    numericFilters,
    filteredAndSortedRegistrations,
    hasAnyFilters,
    toggleSort,
    updateNumericFilter,
    setStatusFilter,
    clearFilters,
  } = useRegistrationsTable(registrations);

  const centeredHeaderStyle = { textAlign: "center" as const };
  const selectedOptionalCount = OPTIONAL_COLUMNS.filter((col) =>
    visible.includes(col.key),
  ).length;

  const title = t("tournament.signup.table.title");

  function optionalColumnLabel(key: RegistrationColumnKey) {
    switch (key) {
      case "signup_max_rating":
        return t("tournament.signup.table.columns.signupMax");
      case "signup_team_rating":
        return t("tournament.signup.table.columns.signupTeam");
      case "signup_max_team_rating":
        return t("tournament.signup.table.columns.signupTeamMax");
      case "current_max_team_rating":
        return t("tournament.signup.table.columns.currentTeamMax");
      default:
        return key;
    }
  }

  return (
    <CollapsibleTile
      title={title}
      subtitle={t("tournament.signup.table.subtitle")}
      defaultOpen
    >
      <Stack gap="md">
        {tableFeedback ? (
          <Alert color="green" variant="light">
            {tableFeedback}
          </Alert>
        ) : null}

        <Group justify="space-between" align="center">
          <div />
          <Group>
            <Menu shadow="md" closeOnItemClick={false}>
              <Menu.Target>
                <Button size="xs" variant="light" leftSection={<IconColumns size={14} />}>
                  {selectedOptionalCount > 0
                    ? t("tournament.signup.table.columnsButtonCount", {
                        count: selectedOptionalCount,
                      })
                    : t("tournament.signup.table.columnsButton")}
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                {OPTIONAL_COLUMNS.map((col) => (
                  <Menu.Item
                    key={col.key}
                    onClick={() => toggle(col.key)}
                    rightSection={visible.includes(col.key) ? "✓" : ""}
                  >
                    {optionalColumnLabel(col.key)}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>

            <Button
              size="xs"
              variant="light"
              disabled={!hasAnyFilters}
              leftSection={<IconX size={14} />}
              onClick={clearFilters}
            >
              {t("tournament.signup.table.clearFilters")}
            </Button>

            <Button
              size="xs"
              variant="light"
              loading={refreshAllMutation.isPending}
              onClick={() => refreshAllMutation.mutate()}
            >
              {t("tournament.signup.table.refreshAll")}
            </Button>
          </Group>
        </Group>

        {registrationsQuery.isPending ? (
          <Loader />
        ) : registrationsQuery.isError ? (
          <Alert color="red" variant="light">
            {t("tournament.signup.table.loadFailed")}
          </Alert>
        ) : (
          <Table
            striped
            highlightOnHover
            styles={{
              th: {
                paddingLeft: 4,
                paddingRight: 4,
              },
              td: {
                paddingLeft: 4,
                paddingRight: 4,
              },
            }}
          >
            <Table.Thead>
              <Table.Tr>
                {visible.includes("user") && (
                  <Table.Th>
                    <RegistrationTableHeaderCell
                      label={t("tournament.signup.table.columns.user")}
                      sortKey="user"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                    />
                  </Table.Th>
                )}

                {visible.includes("aoe") && (
                  <Table.Th>
                    <RegistrationTableHeaderCell
                      label={t("tournament.signup.table.columns.aoe")}
                      sortKey="aoe"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                    />
                  </Table.Th>
                )}

                {visible.includes("signup_rating") && (
                  <Table.Th style={centeredHeaderStyle}>
                    <RegistrationTableHeaderCell
                      label={t("tournament.signup.table.columns.signup1v1")}
                      sortKey="signup_rating"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                      centered
                      filter={
                        <NumericFilterPopover
                          label={t("tournament.signup.table.columns.signup1v1")}
                          range={numericFilters.signup_rating}
                          onChange={(side, value) =>
                            updateNumericFilter("signup_rating", side, value)
                          }
                        />
                      }
                    />
                  </Table.Th>
                )}

                {visible.includes("signup_max_rating") && (
                  <Table.Th style={centeredHeaderStyle}>
                    <RegistrationTableHeaderCell
                      label={t("tournament.signup.table.columns.signupMax")}
                      sortKey="signup_max_rating"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                      centered
                      filter={
                        <NumericFilterPopover
                          label={t("tournament.signup.table.columns.signupMax")}
                          range={numericFilters.signup_max_rating}
                          onChange={(side, value) =>
                            updateNumericFilter("signup_max_rating", side, value)
                          }
                        />
                      }
                    />
                  </Table.Th>
                )}

                {visible.includes("signup_team_rating") && (
                  <Table.Th style={centeredHeaderStyle}>
                    <RegistrationTableHeaderCell
                      label={t("tournament.signup.table.columns.signupTeam")}
                      sortKey="signup_team_rating"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                      centered
                      filter={
                        <NumericFilterPopover
                          label={t("tournament.signup.table.columns.signupTeam")}
                          range={numericFilters.signup_team_rating}
                          onChange={(side, value) =>
                            updateNumericFilter("signup_team_rating", side, value)
                          }
                        />
                      }
                    />
                  </Table.Th>
                )}

                {visible.includes("signup_max_team_rating") && (
                  <Table.Th style={centeredHeaderStyle}>
                    <RegistrationTableHeaderCell
                      label={t("tournament.signup.table.columns.signupTeamMax")}
                      sortKey="signup_max_team_rating"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                      centered
                      filter={
                        <NumericFilterPopover
                          label={t("tournament.signup.table.columns.signupTeamMax")}
                          range={numericFilters.signup_max_team_rating}
                          onChange={(side, value) =>
                            updateNumericFilter("signup_max_team_rating", side, value)
                          }
                        />
                      }
                    />
                  </Table.Th>
                )}

                {visible.includes("current_rating") && (
                  <Table.Th style={centeredHeaderStyle}>
                    <RegistrationTableHeaderCell
                      label={t("tournament.signup.table.columns.current1v1")}
                      sortKey="current_rating"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                      centered
                      filter={
                        <NumericFilterPopover
                          label={t("tournament.signup.table.columns.current1v1")}
                          range={numericFilters.current_rating}
                          onChange={(side, value) =>
                            updateNumericFilter("current_rating", side, value)
                          }
                        />
                      }
                    />
                  </Table.Th>
                )}

                {visible.includes("current_max_rating") && (
                  <Table.Th style={centeredHeaderStyle}>
                    <RegistrationTableHeaderCell
                      label={t("tournament.signup.table.columns.currentMax")}
                      sortKey="current_max_rating"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                      centered
                      filter={
                        <NumericFilterPopover
                          label={t("tournament.signup.table.columns.currentMax")}
                          range={numericFilters.current_max_rating}
                          onChange={(side, value) =>
                            updateNumericFilter("current_max_rating", side, value)
                          }
                        />
                      }
                    />
                  </Table.Th>
                )}

                {visible.includes("current_team_rating") && (
                  <Table.Th style={centeredHeaderStyle}>
                    <RegistrationTableHeaderCell
                      label={t("tournament.signup.table.columns.currentTeam")}
                      sortKey="current_team_rating"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                      centered
                      filter={
                        <NumericFilterPopover
                          label={t("tournament.signup.table.columns.currentTeam")}
                          range={numericFilters.current_team_rating}
                          onChange={(side, value) =>
                            updateNumericFilter("current_team_rating", side, value)
                          }
                        />
                      }
                    />
                  </Table.Th>
                )}

                {visible.includes("current_max_team_rating") && (
                  <Table.Th style={centeredHeaderStyle}>
                    <RegistrationTableHeaderCell
                      label={t("tournament.signup.table.columns.currentTeamMax")}
                      sortKey="current_max_team_rating"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                      centered
                      filter={
                        <NumericFilterPopover
                          label={t("tournament.signup.table.columns.currentTeamMax")}
                          range={numericFilters.current_max_team_rating}
                          onChange={(side, value) =>
                            updateNumericFilter("current_max_team_rating", side, value)
                          }
                        />
                      }
                    />
                  </Table.Th>
                )}

                {visible.includes("total_games") && (
                  <Table.Th style={centeredHeaderStyle}>
                    <RegistrationTableHeaderCell
                      label={t("tournament.signup.table.columns.games")}
                      sortKey="total_games"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                      centered
                      filter={
                        <NumericFilterPopover
                          label={t("tournament.signup.table.columns.games")}
                          range={numericFilters.total_games}
                          onChange={(side, value) =>
                            updateNumericFilter("total_games", side, value)
                          }
                        />
                      }
                    />
                  </Table.Th>
                )}

                {visible.includes("recent_games") && (
                  <Table.Th style={centeredHeaderStyle}>
                    <RegistrationTableHeaderCell
                      label={t("tournament.signup.table.columns.recent")}
                      sortKey="recent_games"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                      centered
                      filter={
                        <NumericFilterPopover
                          label={t("tournament.signup.table.columns.recent")}
                          range={numericFilters.recent_games}
                          onChange={(side, value) =>
                            updateNumericFilter("recent_games", side, value)
                          }
                        />
                      }
                    />
                  </Table.Th>
                )}

                {visible.includes("status") && (
                  <Table.Th style={centeredHeaderStyle}>
                    <RegistrationTableHeaderCell
                      label={t("tournament.signup.table.columns.status")}
                      sortKey="status"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                      centered
                      filter={
                        <StatusFilterPopover
                          values={statusFilter}
                          onChange={setStatusFilter}
                        />
                      }
                    />
                  </Table.Th>
                )}

                <Table.Th style={centeredHeaderStyle}>
                  <Text fw={700} fz="0.92rem" ta="center" lh={1.2}>
                    {t("tournament.signup.table.columns.details")}
                  </Text>
                </Table.Th>

                {visible.includes("actions") && (
                  <Table.Th>
                    <Text fw={700} fz="0.92rem" lh={1.2}>
                      {t("tournament.signup.table.columns.actions")}
                    </Text>
                  </Table.Th>
                )}
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {filteredAndSortedRegistrations.map((item) => (
                <RegistrationTableRow
                  key={item.id}
                  item={item}
                  visible={visible}
                  refreshOneMutation={refreshOneMutation}
                  setDetailsModal={setDetailsModal}
                  openReview={openReview}
                />
              ))}
            </Table.Tbody>
          </Table>
        )}

        {!registrationsQuery.isPending && !registrationsQuery.isError ? (
          <Text size="sm" c="dimmed">
            {t("tournament.signup.table.showing", {
              shown: filteredAndSortedRegistrations.length,
              total: registrations.length,
            })}
          </Text>
        ) : null}
      </Stack>
    </CollapsibleTile>
  );
}