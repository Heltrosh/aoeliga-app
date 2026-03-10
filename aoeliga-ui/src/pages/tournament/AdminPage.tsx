import { useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Anchor,
  Avatar,
  Badge,
  Button,
  Card,
  Collapse,
  Divider,
  Group,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconChevronDown, IconChevronUp, IconExternalLink, IconTrash, IconUser } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { listUsers, type UserListItem } from "../../api/users";
import {
  addTournamentAdmin,
  addTournamentPlayer,
  addTournamentStreamer,
  getTournamentAdmins,
  getTournamentPlayers,
  getTournamentStreamers,
  removeTournamentAdmin,
  removeTournamentPlayer,
  removeTournamentStreamer,
} from "../../api/tournaments";
import { useTournament } from "../../hooks/useTournament";
import { useTournamentAccess } from "../../hooks/useTournamentAccess";

const adminSchema = z.object({
  user_id: z.number().int().positive(),
  role: z.enum(["admin", "moderator"]),
});

const streamerSchema = z.object({
  user_id: z.number().int().positive(),
});

const playerSchema = z.object({
  user_id: z.number().int().positive(),
  aoe_id: z.string().min(1, "AoE ID is required"),
  status: z.string(),
});

type AdminFormValues = z.infer<typeof adminSchema>;
type StreamerFormValues = z.infer<typeof streamerSchema>;
type PlayerFormValues = z.infer<typeof playerSchema>;

type WithNames = {
  id?: number;
  user_id?: number;
  discord_id?: string | null;
  discord_name: string | null;
  display_name: string | null;
  avatar?: string | null;
};

function discordAvatarUrl(discordId?: string | null, avatar?: string | null, size = 64) {
  if (!discordId || !avatar) return null;
  const ext = avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${ext}?size=${size}`;
}

function userPrimary(user: Pick<WithNames, "display_name" | "discord_name" | "id" | "user_id">) {
  return (
    user.display_name ||
    user.discord_name ||
    `User #${user.id ?? user.user_id ?? "?"}`
  );
}

function userSecondary(user: Pick<WithNames, "display_name" | "discord_name">) {
  if (user.display_name && user.discord_name && user.display_name !== user.discord_name) {
    return user.discord_name;
  }
  return user.discord_name ?? "—";
}

function userOptionLabel(user: UserListItem) {
  const primary = userPrimary(user);
  const secondary = userSecondary(user);
  return secondary && secondary !== primary ? `${primary} (${secondary})` : primary;
}

function initialsFromUser(user: Pick<WithNames, "display_name" | "discord_name">) {
  const source = user.display_name || user.discord_name || "?";
  return source.trim().slice(0, 2).toUpperCase();
}

function UserAvatar({
  user,
  size = "md",
}: {
  user: WithNames;
  size?: number | "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const src = discordAvatarUrl(user.discord_id, user.avatar, 64);

  if (src) {
    return <Avatar src={src} size={size} radius="xl" />;
  }

  const initials = initialsFromUser(user);
  return (
    <Avatar size={size} radius="xl">
      {initials === "?" ? <IconUser size={14} /> : initials}
    </Avatar>
  );
}

function UserPicker({
  label,
  users,
  value,
  onChange,
  disabled,
}: {
  label: string;
  users: UserListItem[];
  value: UserListItem | null;
  onChange: (user: UserListItem | null) => void;
  disabled?: boolean;
}) {
  const data = useMemo(() => {
    const seen = new Set<string>();

    return users
      .filter((u) => u.id !== undefined && u.id !== null)
      .map((u) => ({
        value: String(u.id),
        label: userOptionLabel(u),
      }))
      .filter((option) => {
        if (!option.value || option.value === "undefined" || option.value === "null") {
          return false;
        }
        if (seen.has(option.value)) {
          return false;
        }
        seen.add(option.value);
        return true;
      });
  }, [users]);

  return (
    <Select
      label={label}
      placeholder="Select user"
      searchable
      clearable
      nothingFoundMessage="No users found"
      data={data}
      value={value ? String(value.id) : null}
      onChange={(val) => {
        const user = users.find((u) => String(u.id) === val) ?? null;
        onChange(user);
      }}
      maxDropdownHeight={280}
      disabled={disabled}
    />
  );
}

function SelectedUserInfo({
  user,
  emptyText = "No user selected",
}: {
  user: UserListItem | null;
  emptyText?: string;
}) {
  if (!user) {
    return (
      <Text c="dimmed" size="sm">
        {emptyText}
      </Text>
    );
  }

  return (
    <Group align="flex-start" gap="sm">
      <UserAvatar user={user} />
      <Stack gap={2}>
        <Text fw={600}>{userPrimary(user)}</Text>
        <Text size="sm" c="dimmed">
          {userSecondary(user)}
        </Text>
      </Stack>
    </Group>
  );
}

function CurrentUserCard({
  user,
  badge,
  badgeColor,
  onRemove,
  removeLoading,
  extraLines = [],
}: {
  user: WithNames;
  badge: string;
  badgeColor: string;
  onRemove: () => void;
  removeLoading?: boolean;
  extraLines?: React.ReactNode[];
}) {
  return (
    <Card withBorder radius="md" p="sm">
      <Group justify="space-between" align="flex-start">
        <Group align="flex-start" gap="sm" wrap="nowrap">
          <UserAvatar user={user} />
          <div>
            <Text fw={600}>{userPrimary(user)}</Text>
            <Text size="sm" c="dimmed">
              {userSecondary(user)}
            </Text>
            {extraLines.map((line, i) => (
              <Text key={i} size="sm" c="dimmed">
                {line}
              </Text>
            ))}
          </div>
        </Group>

        <Group gap="xs" wrap="nowrap">
          <Badge color={badgeColor} variant="light">
            {badge}
          </Badge>

          <ActionIcon
            color="red"
            variant="subtle"
            onClick={onRemove}
            loading={removeLoading}
            aria-label={`Remove ${badge}`}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </Card>
  );
}

function CollapsibleTile({
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [opened, setOpened] = useState(defaultOpen);

  return (
    <Card
      withBorder
      radius="lg"
      p="lg"
      style={{
        background: "rgba(17, 27, 43, 0.78)",
        borderColor: "rgba(229,154,42,0.28)",
        boxShadow: "0 0 0 1px rgba(229,154,42,0.08) inset",
      }}
    >
      <Group
        justify="space-between"
        align="flex-start"
        style={{ cursor: "pointer" }}
        onClick={() => setOpened((v) => !v)}
      >
        <div>
          <Title order={3}>{title}</Title>
          <Text size="sm" c="dimmed">
            {subtitle}
          </Text>
        </div>

        <ActionIcon variant="subtle" color="gold" aria-label={opened ? "Collapse" : "Expand"}>
          {opened ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
        </ActionIcon>
      </Group>

      <Collapse in={opened}>
        <div style={{ marginTop: 16 }}>{children}</div>
      </Collapse>
    </Card>
  );
}

export default function AdminPage() {
  const { slug } = useParams();
  const qc = useQueryClient();
  const { tournament } = useTournament();
  const access = useTournamentAccess();

  const [selectedAdminUser, setSelectedAdminUser] = useState<UserListItem | null>(null);
  const [selectedStreamerUser, setSelectedStreamerUser] = useState<UserListItem | null>(null);
  const [selectedPlayerUser, setSelectedPlayerUser] = useState<UserListItem | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users-lightweight"],
    queryFn: listUsers,
  });

  const adminsQuery = useQuery({
    queryKey: ["tournament-admins", slug],
    queryFn: () => getTournamentAdmins(slug!),
    enabled: !!slug,
  });

  const streamersQuery = useQuery({
    queryKey: ["tournament-streamers", slug],
    queryFn: () => getTournamentStreamers(slug!),
    enabled: !!slug,
  });

  const playersQuery = useQuery({
    queryKey: ["tournament-players", slug],
    queryFn: () => getTournamentPlayers(slug!),
    enabled: !!slug,
  });

  const adminForm = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      user_id: 0,
      role: "moderator",
    },
  });

  const streamerForm = useForm<StreamerFormValues>({
    resolver: zodResolver(streamerSchema),
    defaultValues: {
      user_id: 0,
    },
  });

  const playerForm = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      user_id: 0,
      aoe_id: "",
      status: "active",
    },
  });

  const refreshAll = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["tournament-admins", slug] }),
      qc.invalidateQueries({ queryKey: ["tournament-streamers", slug] }),
      qc.invalidateQueries({ queryKey: ["tournament-players", slug] }),
      qc.invalidateQueries({ queryKey: ["tournament", slug] }),
    ]);
  };

  const addAdminMutation = useMutation({
    mutationFn: (values: AdminFormValues) => addTournamentAdmin(slug!, values),
    onSuccess: async () => {
      setSelectedAdminUser(null);
      adminForm.reset({ user_id: 0, role: "moderator" });
      await refreshAll();
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: (userId: number) => removeTournamentAdmin(slug!, userId),
    onSuccess: refreshAll,
  });

  const addStreamerMutation = useMutation({
    mutationFn: (values: StreamerFormValues) => addTournamentStreamer(slug!, values),
    onSuccess: async () => {
      setSelectedStreamerUser(null);
      streamerForm.reset({ user_id: 0 });
      await refreshAll();
    },
  });

  const removeStreamerMutation = useMutation({
    mutationFn: (userId: number) => removeTournamentStreamer(slug!, userId),
    onSuccess: refreshAll,
  });

  const addPlayerMutation = useMutation({
    mutationFn: (values: PlayerFormValues) => addTournamentPlayer(slug!, values),
    onSuccess: async () => {
      setSelectedPlayerUser(null);
      playerForm.reset({ user_id: 0, aoe_id: "", status: "active" });
      await refreshAll();
    },
  });

  const removePlayerMutation = useMutation({
    mutationFn: (playerId: number) => removeTournamentPlayer(slug!, playerId),
    onSuccess: refreshAll,
  });

  const users = usersQuery.data?.users ?? [];
  const adminMembers = adminsQuery.data?.admins ?? [];
  const streamerMembers = streamersQuery.data?.streamers ?? [];
  const playerMembers = playersQuery.data?.players ?? [];

  const canSeePage =
    access.canAssignAdmins || access.canAssignStreamers || access.canManagePlayers;

  const loadingAny =
    usersQuery.isLoading ||
    adminsQuery.isLoading ||
    streamersQuery.isLoading ||
    playersQuery.isLoading;

  if (!canSeePage) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
        You do not have access to this page.
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Administration</Title>
        <Text c="dimmed">
          Manage staff and players for {tournament?.name ?? "this tournament"}.
        </Text>
      </div>

      {loadingAny && <Loader />}

      <Stack gap="lg">
        {(access.canAssignAdmins || access.canAssignStreamers) && (
          <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg" style={{ alignItems: "start" }}>
            {access.canAssignAdmins && (
              <div style={{ alignSelf: "start" }}>
                <CollapsibleTile
                  title="Admins & Moderators"
                  subtitle="Assign and remove tournament admin roles."
                  defaultOpen
                >
                  <Stack gap="md">
                    <UserPicker
                      label="Select user"
                      users={users}
                      value={selectedAdminUser}
                      onChange={(user) => {
                        setSelectedAdminUser(user);
                        adminForm.setValue("user_id", user?.id ?? 0);
                      }}
                      disabled={addAdminMutation.isPending}
                    />

                    <Divider />

                    <div>
                      <Text fw={600} mb={4}>
                        Selected user
                      </Text>
                      <SelectedUserInfo user={selectedAdminUser} />
                    </div>

                    <Group>
                      <Button
                        variant={adminForm.watch("role") === "admin" ? "filled" : "light"}
                        color="red"
                        onClick={() => adminForm.setValue("role", "admin")}
                        disabled={!selectedAdminUser || addAdminMutation.isPending}
                      >
                        Add as admin
                      </Button>

                      <Button
                        variant={adminForm.watch("role") === "moderator" ? "filled" : "light"}
                        color="blue"
                        onClick={() => adminForm.setValue("role", "moderator")}
                        disabled={!selectedAdminUser || addAdminMutation.isPending}
                      >
                        Add as moderator
                      </Button>
                    </Group>

                    <Button
                      color="gold"
                      disabled={!selectedAdminUser}
                      loading={addAdminMutation.isPending}
                      onClick={adminForm.handleSubmit((values) => addAdminMutation.mutate(values))}
                    >
                      Save role assignment
                    </Button>

                    {addAdminMutation.isError && (
                      <Text c="red" size="sm">
                        Failed to add admin/moderator
                      </Text>
                    )}

                    <Divider />

                    <Title order={4}>Current staff</Title>
                    <Stack gap="xs">
                      {adminMembers.length === 0 ? (
                        <Text c="dimmed" size="sm">
                          No staff assigned yet.
                        </Text>
                      ) : (
                        adminMembers.map((item) => (
                          <CurrentUserCard
                            key={`${item.user_id}-${item.role}`}
                            user={item}
                            badge={item.role}
                            badgeColor={item.role === "admin" ? "red" : "blue"}
                            onRemove={() => removeAdminMutation.mutate(item.user_id)}
                            removeLoading={
                              removeAdminMutation.isPending &&
                              removeAdminMutation.variables === item.user_id
                            }
                          />
                        ))
                      )}
                    </Stack>
                  </Stack>
                </CollapsibleTile>
              </div>
            )}

            {access.canAssignStreamers && (
              <div style={{ alignSelf: "start" }}>              
                <CollapsibleTile
                  title="Streamers"
                  subtitle="Assign and remove tournament streamers."
                  defaultOpen
                >
                  <Stack gap="md">
                    <UserPicker
                      label="Select user"
                      users={users}
                      value={selectedStreamerUser}
                      onChange={(user) => {
                        setSelectedStreamerUser(user);
                        streamerForm.setValue("user_id", user?.id ?? 0);
                      }}
                      disabled={addStreamerMutation.isPending}
                    />

                    <Divider />

                    <div>
                      <Text fw={600} mb={4}>
                        Selected user
                      </Text>
                      <SelectedUserInfo user={selectedStreamerUser} />
                    </div>

                    <Button
                      color="grape"
                      disabled={!selectedStreamerUser}
                      loading={addStreamerMutation.isPending}
                      onClick={streamerForm.handleSubmit((values) => addStreamerMutation.mutate(values))}
                    >
                      Add as streamer
                    </Button>

                    {addStreamerMutation.isError && (
                      <Text c="red" size="sm">
                        Failed to add streamer
                      </Text>
                    )}

                    <Divider />

                    <Title order={4}>Current streamers</Title>
                    <Stack gap="xs">
                      {streamerMembers.length === 0 ? (
                        <Text c="dimmed" size="sm">
                          No streamers assigned yet.
                        </Text>
                      ) : (
                        streamerMembers.map((item) => (
                          <CurrentUserCard
                            key={item.user_id}
                            user={item}
                            badge="streamer"
                            badgeColor="grape"
                            onRemove={() => removeStreamerMutation.mutate(item.user_id)}
                            removeLoading={
                              removeStreamerMutation.isPending &&
                              removeStreamerMutation.variables === item.user_id
                            }
                          />
                        ))
                      )}
                    </Stack>
                  </Stack>
                </CollapsibleTile>
              </div>
            )}
          </SimpleGrid>
        )}

        {access.canManagePlayers && (
          <CollapsibleTile
            title="Players"
            subtitle="Add and remove tournament players."
            defaultOpen
          >
            <Stack gap="md">
              <UserPicker
                label="Select user"
                users={users}
                value={selectedPlayerUser}
                onChange={(user) => {
                  setSelectedPlayerUser(user);
                  playerForm.setValue("user_id", user?.id ?? 0);
                }}
                disabled={addPlayerMutation.isPending}
              />

              <Divider />

              <SimpleGrid cols={{ base: 1, md: 2 }}>
                <div>
                  <Text fw={600} mb={4}>
                    Selected user
                  </Text>
                  <SelectedUserInfo user={selectedPlayerUser} />
                </div>

                <TextInput
                  label="AoE ID"
                  placeholder="e.g. 2047125"
                  {...playerForm.register("aoe_id")}
                  error={playerForm.formState.errors.aoe_id?.message}
                />
              </SimpleGrid>

              <Group>
                <Button
                  color="green"
                  disabled={!selectedPlayerUser}
                  loading={addPlayerMutation.isPending}
                  onClick={playerForm.handleSubmit((values) => addPlayerMutation.mutate(values))}
                >
                  Add as player
                </Button>
              </Group>

              {addPlayerMutation.isError && (
                <Text c="red" size="sm">
                  Failed to add player
                </Text>
              )}

              <Divider />

              <Title order={4}>Current players</Title>
              <Stack gap="xs">
                {playerMembers.length === 0 ? (
                  <Text c="dimmed" size="sm">
                    No players assigned yet.
                  </Text>
                ) : (
                  playerMembers.map((item) => (
                    <CurrentUserCard
                      key={item.id}
                      user={item}
                      badge={item.status}
                      badgeColor="green"
                      extraLines={[
                        <Anchor
                          key="aoe2insights"
                          href={`https://www.aoe2insights.com/user/${item.aoe_id}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                        >
                          AoE2Insights <IconExternalLink size={13} style={{ marginLeft: 0 }} />
                        </Anchor>,
                      ]}
                      onRemove={() => removePlayerMutation.mutate(item.id)}
                      removeLoading={
                        removePlayerMutation.isPending &&
                        removePlayerMutation.variables === item.id
                      }
                    />
                  ))
                )}
              </Stack>
            </Stack>
          </CollapsibleTile>
        )}
      </Stack>
    </Stack>
  );
}