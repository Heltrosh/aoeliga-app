import { useMemo, useState } from "react";
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Collapse,
  Group,
  Select,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconExternalLink,
  IconTrash,
  IconUser,
} from "@tabler/icons-react";

import type { UserListItem } from "../../api/users";
import { AppSurface } from "../common/AppSurface";
import { useI18n } from "../../i18n/I18nProvider";

type WithNames = {
  id?: number;
  user_id?: number;
  discord_id?: string | null;
  discord_name: string | null;
  display_name: string | null;
  avatar?: string | null;
};

export function discordAvatarUrl(discordId?: string | null, avatar?: string | null, size = 64) {
  if (!discordId || !avatar) return null;
  const ext = avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${ext}?size=${size}`;
}

export function userPrimary(user: Pick<WithNames, "display_name" | "discord_name" | "id" | "user_id">) {
  return user.display_name || user.discord_name || `User #${user.id ?? user.user_id ?? "?"}`;
}

export function userSecondary(user: Pick<WithNames, "display_name" | "discord_name">) {
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

export function UserAvatar({
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
  return <Avatar size={size} radius="xl">{initials === "?" ? <IconUser size={14} /> : initials}</Avatar>;
}

export function UserPicker({
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
  const { t } = useI18n();
  const data = useMemo(() => {
    const seen = new Set<string>();

    return users
      .filter((user) => user.id !== undefined && user.id !== null)
      .map((user) => ({ value: String(user.id), label: userOptionLabel(user) }))
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
      placeholder={t("userpicker.selectUser")}
      searchable
      clearable
      nothingFoundMessage={t("userpicker.noUsers")}
      data={data}
      value={value ? String(value.id) : null}
      onChange={(selectedValue) => {
        const user = users.find((option) => String(option.id) === selectedValue) ?? null;
        onChange(user);
      }}
      maxDropdownHeight={280}
      disabled={disabled}
    />
  );
}

export function SelectedUserInfo({
  user,
  emptyText
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

export function CurrentUserCard({
  user,
  badge,
  badgeLabel,
  badgeColor,
  onRemove,
  removeLoading,
  extraLines = [],
}: {
  user: WithNames;
  badge: React.ReactNode;
  badgeLabel: string;
  badgeColor: string;
  onRemove: () => void;
  removeLoading?: boolean;
  extraLines?: React.ReactNode[];
}) {
  const { t } = useI18n();
  return (
    <AppSurface variant="card" p="sm">
      <Group justify="space-between" align="flex-start">
        <Group align="flex-start" gap="sm" wrap="nowrap">
          <UserAvatar user={user} />
          <div>
            <Text fw={600}>{userPrimary(user)}</Text>
            <Text size="sm" c="dimmed">
              {userSecondary(user)}
            </Text>
            {extraLines.map((line, index) => (
              <Text key={index} size="sm" c="dimmed">
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
            aria-label={t("tournament.admin.common.remove", {badge: badgeLabel})}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </AppSurface>
  );
}

export function AoE2InsightsLink({ aoeId }: { aoeId: string }) {
  return (
    <Anchor
      href={`https://www.aoe2insights.com/user/${aoeId}/`}
      target="_blank"
      rel="noopener noreferrer"
      size="sm"
    >
      AoE2Insights <IconExternalLink size={13} style={{ marginLeft: 0 }} />
    </Anchor>
  );
}

export function CollapsibleTile({
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
  const { t } = useI18n();

  return (
    <AppSurface variant="card" p="lg">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Title order={3}>{title}</Title>
          <Text size="sm" c="dimmed">
            {subtitle}
          </Text>
        </div>

        <ActionIcon
          variant="subtle"
          color="gold"
          onClick={() => setOpened((current) => !current)}
          aria-label={
            opened
              ? t("collapsibletile.collapse", { title: title })
              : t("collapsibletile.expand", { title: title })
          }
        >
          {opened ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
        </ActionIcon>
      </Group>

      <Collapse in={opened}>
        <div style={{ marginTop: 16 }}>{children}</div>
      </Collapse>
    </AppSurface>
  );
}

export function AssignmentActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Group>{children}</Group>;
}

export type TournamentAdminUserLike = WithNames;
