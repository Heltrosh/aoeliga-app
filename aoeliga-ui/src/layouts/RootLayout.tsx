import {
  AppShell,
  Group,
  Image,
  Text,
  ActionIcon,
  Menu,
  Box,
  Tooltip,
  Button,
  Avatar,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconUser,
  IconSun,
  IconMoon,
  IconChevronDown,
  IconLogin,
  IconLogout,
} from "@tabler/icons-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import logo from "../assets/aoeligalogo.png";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/I18nProvider";
import { useTournamentHeader } from "../tournament/TournamentHeaderContext";

function discordAvatarUrl(discordId: string, avatar: string | null, size = 64) {
  if (!avatar) return null;
  const ext = avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${ext}?size=${size}`;
}

export default function RootLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, loading, refresh, login, logout } = useAuth();
  const { locale, setLocale } = useI18n();
  const { title: tournamentTitle } = useTournamentHeader();


  const [dark, setDark] = useState(true); // visual placeholder only

  const inTournament = loc.pathname.startsWith("/t/");
  const slug = inTournament ? loc.pathname.split("/")[2] ?? null : null;

  const avatarUrl = user ? discordAvatarUrl(user.discord_id, user.avatar, 64) : null;
  const displayName = user?.display_name || user?.discord_name || null;

  async function handleLogout() {
    await logout().catch(() => null);
    refresh();
  }

  function handleLogin() {
    const redirect = loc.pathname + loc.search;
    login(redirect);
  }

  return (
    <AppShell
      header={{ height: 60 }}
      padding={0}
      styles={{
        main: {
          background:
            "radial-gradient(900px 600px at 10% 0%, rgba(229,154,42,0.18), transparent 55%), " +
            "radial-gradient(900px 600px at 90% 0%, rgba(247,37,61,0.14), transparent 55%)",
          minHeight: "100vh",
        },
      }}
    >
      <AppShell.Header px="md" style={{ borderBottom: "1px solid rgba(229,154,42,0.18)" }}>
        <Group justify="space-between" h="100%">
          <Group gap="sm">
            {inTournament && (
              <Tooltip label="Back to tournaments" position="bottom">
                <ActionIcon
                  variant="subtle"
                  color="gold"
                  onClick={() => nav("/")}
                  aria-label="Back to tournaments"
                >
                  <IconArrowLeft size={18} />
                </ActionIcon>
              </Tooltip>
            )}

            <Group gap="sm" style={{ cursor: "pointer" }} onClick={() => nav("/")}>
              <Image src={logo} w={45} h={45} radius="xl" />
              <Box>
                <Text fw={800}>CZ/SK AoE Liga</Text>
                {inTournament && (
                  <Text size="xs" c="dimmed">
                    {tournamentTitle ?? slug ?? ""} 
                  </Text>
                )}
              </Box>
            </Group>
          </Group>

          <Group gap="xs">
            <Tooltip label="Switch language" position="bottom">
              <Button
                variant="subtle"
                color="gold"
                onClick={() => setLocale(locale === "en" ? "cs" : "en")}
              >
                {locale.toUpperCase()}
              </Button>
            </Tooltip>

            <ActionIcon
              variant="subtle"
              onClick={() => setDark((v) => !v)}
              aria-label="Toggle theme"
            >
              {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>

            {!user ? (
              <Button
                variant="light"
                color="gold"
                leftSection={<IconLogin size={18} />}
                loading={loading}
                onClick={handleLogin}
              >
                Log in
              </Button>
            ) : (
              <Menu position="bottom-end" withArrow>
                <Menu.Target>
                  <Button
                    variant="subtle"
                    color="gold"
                    rightSection={<IconChevronDown size={16} />}
                    styles={{ root: { borderRadius: 999 } }}
                  >
                    <Group gap={8} wrap="nowrap">
                      {user.avatar ? (
                        <Avatar size={24} radius="xl" src={avatarUrl ?? undefined} />
                      ) : (
                        <Avatar size={24} radius="xl">
                          <IconUser size={14} />
                        </Avatar>
                      )}

                      <Text fw={650} size="sm" style={{ maxWidth: 180 }} truncate>
                        {displayName ?? "User"}
                      </Text>
                    </Group>
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Account</Menu.Label>
                  <Menu.Item leftSection={<IconUser size={16} />} disabled>
                    Profile (soon)
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={16} />}
                    onClick={handleLogout}
                  >
                    Log out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}