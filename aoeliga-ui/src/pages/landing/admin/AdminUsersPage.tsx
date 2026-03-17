import { useState } from "react";
import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconBan, IconCheck, IconChevronLeft, IconSearch, IconShield, IconShieldCheck } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../../../auth/AuthContext";
import { adminKeys } from "../../../api/queryKeys";
import { listAdminUsers, setAdminUserAdmin, setAdminUserBan } from "../../../api/admin";
import type { AdminUserListItem } from "../../../api/schemas/admin";
import { useLandingPage } from "../../../hooks/useLandingPage";
import { useI18n } from "../../../i18n/I18nProvider";
import { getLandingNavigationAccess } from "../landingAccess";
import { LandingShell } from "../LandingShell";
import { AppSurface } from "../../../components/common/AppSurface";

function getUserLabel(user: AdminUserListItem) {
  return user.display_name || user.discord_name || "Unknown";
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { tournamentsQuery } = useLandingPage();
  const { t } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [banTarget, setBanTarget] = useState<AdminUserListItem | null>(null);
  const [banReason, setBanReason] = useState("");

  const tournaments = tournamentsQuery.data?.tournaments ?? [];
  const { canSeeRulesets, canSeeAdmin } = getLandingNavigationAccess(
    user,
    tournaments,
  );

  const usersQuery = useQuery({
    queryKey: adminKeys.users(search),
    queryFn: () => listAdminUsers(search),
    enabled: canSeeAdmin,
  });

  const toggleBanMutation = useMutation({
    mutationFn: ({
      userId,
      isBanned,
      banReason,
    }: {
      userId: number;
      isBanned: boolean;
      banReason?: string | null;
    }) =>
      setAdminUserBan(userId, {
        is_banned: isBanned,
        ban_reason: banReason ?? null,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: adminKeys.all });
      closeBanModal();
    },
  });

  const toggleAdminMutation = useMutation({
  mutationFn: ({
    userId,
    isAdmin,
  }: {
    userId: number;
    isAdmin: boolean;
  }) =>
    setAdminUserAdmin(userId, {
      is_admin: isAdmin,
    }),
  onSuccess: async () => {
    await qc.invalidateQueries({ queryKey: adminKeys.all });
  },
});

  const users = usersQuery.data?.users ?? [];

  function openBanModal(target: AdminUserListItem) {
    setBanTarget(target);
    setBanReason(target.ban_reason ?? "");
  }

  function closeBanModal() {
    setBanTarget(null);
    setBanReason("");
  }

  if (!tournamentsQuery.isLoading && !canSeeAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <LandingShell
        section="admin"
        title={t("landing.title.admin")}
        canSeeRulesets={canSeeRulesets}
        canSeeAdmin={canSeeAdmin}
      >
        {tournamentsQuery.isLoading || usersQuery.isLoading ? (
          <Loader />
        ) : usersQuery.isError ? (
          <Text c="red">{t("landing.admin.users.error")}</Text>
        ) : (
          <Stack gap="md">
            <Group>
              <Anchor
                  onClick={() => navigate("/admin")}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                  <IconChevronLeft size={14} />
                  {t("landing.admin.users.back")}
              </Anchor>
            </Group>
            <AppSurface p="xl">
              <Stack gap="xs">
                <Title order={3}>{t("landing.admin.users.title")}</Title>
                <Text c="dimmed">
                  {t("landing.admin.users.description")}
                </Text>
              </Stack>
            </AppSurface>

            <AppSurface p="md">
              <TextInput
                label={t("landing.admin.users.search")}
                placeholder={t("landing.admin.users.search.placeholder")}
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                leftSection={<IconSearch size={16} />}
              />
            </AppSurface>

            <AppSurface p="md" >
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t("landing.admin.users.table.user")}</Table.Th>
                    <Table.Th>{t("landing.admin.users.table.discord")}</Table.Th>
                    <Table.Th>{t("landing.admin.users.table.admin")}</Table.Th>
                    <Table.Th>{t("landing.admin.users.table.status")}</Table.Th>
                    <Table.Th>{t("landing.admin.users.table.reason")}</Table.Th>
                    <Table.Th>{t("landing.admin.users.table.lastlogin")}</Table.Th>
                    <Table.Th style={{ width: 100 }}>{t("landing.admin.users.table.action")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {users.map((entry) => {
                    const isBanned = entry.is_banned === 1;

                    return (
                      <Table.Tr key={entry.id}>
                        <Table.Td>
                          <Text fw={600}>{getUserLabel(entry)}</Text>
                        </Table.Td>

                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {entry.discord_name ?? "—"}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Badge
                            variant="light"
                            color={entry.is_admin === 1 ? "gold" : "gray"}
                          >
                            {entry.is_admin === 1 ? t("landing.admin.users.table.admin") : t("landing.admin.users.table.user")}
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          <Badge
                            variant="light"
                            color={isBanned ? "red" : "green"}
                          >
                            {isBanned ? t("landing.admin.users.table.banned") : t("landing.admin.users.table.active")}
                          </Badge>
                        </Table.Td>                        

                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {entry.ban_reason || "—"}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {entry.last_login_at ?? "—"}
                          </Text>
                        </Table.Td>

                        <Table.Td>
                          <Tooltip
                            label={
                                entry.is_admin === 1
                                ? t("landing.admin.users.table.removeadmin")
                                : t("landing.admin.users.table.addadmin")
                            }
                            >
                            <ActionIcon
                                color={entry.is_admin === 1 ? "gray" : "gold"}
                                variant="light"
                                loading={toggleAdminMutation.isPending}
                                onClick={() =>
                                toggleAdminMutation.mutate({
                                    userId: entry.id,
                                    isAdmin: entry.is_admin !== 1,
                                })
                                }
                            >
                                {entry.is_admin === 1 ? (
                                <IconShield size={16} />
                                ) : (
                                <IconShieldCheck size={16} />
                                )}
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={isBanned ? t("landing.admin.users.table.unban") : t("landing.admin.users.table.ban")}>
                            <ActionIcon
                              color={isBanned ? "green" : "red"}
                              variant="light"
                              loading={toggleBanMutation.isPending}
                              onClick={() => {
                                if (isBanned) {
                                  toggleBanMutation.mutate({
                                    userId: entry.id,
                                    isBanned: false,
                                    banReason: null,
                                  });
                                  return;
                                }

                                openBanModal(entry);
                              }}
                            >
                              {isBanned ? (
                                <IconCheck size={16} />
                              ) : (
                                <IconBan size={16} />
                              )}
                            </ActionIcon>
                          </Tooltip>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </AppSurface>
          </Stack>
        )}
      </LandingShell>

      <Modal
        opened={banTarget != null}
        onClose={closeBanModal}
        title={t("landing.admin.users.table.ban")}
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Ban{" "}
            <Text span fw={700}>
              {banTarget ? getUserLabel(banTarget) : ""}
            </Text>
            ?
          </Text>

          <Textarea
            label={t("landing.admin.users.ban.reason.title")}
            placeholder={t("landing.admin.users.ban.reason.placeholder")}
            value={banReason}
            onChange={(event) => setBanReason(event.currentTarget.value)}
            autosize
            minRows={4}
          />

          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeBanModal}>
              Cancel
            </Button>

            <Button
              color="red"
              loading={toggleBanMutation.isPending}
              onClick={() => {
                if (!banTarget) return;

                toggleBanMutation.mutate({
                  userId: banTarget.id,
                  isBanned: true,
                  banReason: banReason.trim() || null,
                });
              }}
            >
              {t("landing.admin.users.table.ban")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}