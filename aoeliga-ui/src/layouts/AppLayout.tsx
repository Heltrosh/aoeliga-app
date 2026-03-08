import {
  AppShell,
  Group,
  Image,
  Text,
  ActionIcon,
  Menu,
  Box,
  NavLink,
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
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import logo from "../assets/aoeligalogo.png";
import { useMemo, useState } from "react";
import { IconLayoutDashboard, IconStack2, IconCalendarEvent, IconUsers } from "@tabler/icons-react";
import type { AuthedUser } from "../App";

type Props = {
  user: AuthedUser | null;
  authLoading: boolean;
  refreshMe: () => Promise<void>;
};

function discordAvatarUrl(discordId: string, avatar: string | null, size = 64) {
  if (!avatar) return null;
  const ext = avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${ext}?size=${size}`;
}


export default function AppLayout({ user, authLoading, refreshMe }: Props) {
  const nav = useNavigate();
  const loc = useLocation();
  const { slug } = useParams();

  const [dark, setDark] = useState(true); // placeholder for now
  const avatarUrl = user ? discordAvatarUrl(user.discord_id, user.avatar, 64) : null;

  // Detect if we’re inside a tournament
  const inTournament = loc.pathname.startsWith("/t/");

  const base = slug ? `/t/${slug}` : "";

  const navItems = useMemo(() => {
    if (!slug) return [];
    return [
      { label: "Dashboard", to: `${base}/dashboard`, icon: <IconLayoutDashboard size={18} /> },
      { label: "Divisions", to: `${base}/divisions`, icon: <IconStack2 size={18} /> },
      { label: "Schedule", to: `${base}/schedule`, icon: <IconCalendarEvent size={18} /> },
      { label: "Players", to: `${base}/players`, icon: <IconUsers size={18} /> },
    ];
  }, [slug, base]);

  const displayName = user?.display_name || user?.discord_name || null;

  async function logout() {
    await fetch("/app/auth/logout", { method: "POST", credentials: "include" }).catch(() => null);
    await refreshMe();
  }

  function login() {
    const redirect = loc.pathname + loc.search;
    window.location.assign(`/app/auth/discord?redirect=${encodeURIComponent(redirect)}`);
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={inTournament ? { width: 250, breakpoint: "sm" } : undefined}
      padding={0}
      styles={{
        main: {
          background:
            "radial-gradient(900px 600px at 10% 0%, rgba(229,154,42,0.18), transparent 55%), " +
            "radial-gradient(900px 600px at 90% 0%, rgba(247,37,61,0.14), transparent 55%)",
        },
      }}
    >
      <AppShell.Header px="md" style={{ borderBottom: "1px solid rgba(229,154,42,0.18)" }}>
        <Group justify="space-between" h="100%">
          {/* Left: back arrow (tournament only) + logo */}
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
                {inTournament && slug && (
                  <Text size="xs" c="dimmed">
                    {slug}
                  </Text>
                )}
              </Box>
            </Group>
          </Group>

          {/* Right: controls */}
          <Group gap="xs">
            <ActionIcon variant="subtle" onClick={() => setDark((v) => !v)} aria-label="Toggle theme">
              {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>

            {!user ? (
              <Button
                variant="light"
                color="gold"
                leftSection={<IconLogin size={18} />}
                loading={authLoading}
                onClick={login}
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
                      {user?.avatar ? (
                        <Avatar
                          size={24}
                          radius="xl"
                          src={avatarUrl ?? undefined}
                        />
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
                    onClick={logout}
                  >
                    Log out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      {inTournament && (
        <AppShell.Navbar
          p="xs"
          style={{
            background: "rgba(21,31,40,0.45)",
            backdropFilter: "blur(10px)",
            borderRight: "1px solid rgba(229,154,42,0.10)",
            boxShadow: "inset -1px 0 0 rgba(229,154,42,0.10)",
          }}
        >
          {navItems.map((it) => {
            const active = loc.pathname === it.to;

            return (
              <NavLink
                key={it.to}
                label={it.label}
                leftSection={it.icon}
                active={active}
                onClick={() => nav(it.to)}
                variant="subtle"
                color="gold"
                mb={3}
                styles={{
                  root: {
                    borderRadius: 12,
                    paddingTop: 6,
                    paddingBottom: 6,
                    borderLeft: active
                      ? "3px solid rgba(229,154,42,0.95)"
                      : "3px solid transparent",
                    background: active
                      ? "linear-gradient(90deg, rgba(229,154,42,0.22) 0%, rgba(229,154,42,0.10) 45%, rgba(229,154,42,0.00) 100%)"
                      : "transparent",
                    transition: "background-color 150ms ease, transform 120ms ease",
                  },
                  label: {
                    fontWeight: active ? 650 : 520,
                    letterSpacing: 0.15,
                    fontSize: "0.95rem",
                  },
                  section: {
                    color: active ? "rgba(255,191,84,0.95)" : "rgba(221,226,234,0.82)",
                  },
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateX(1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateX(0px)";
                }}
              />
            );
          })}
        </AppShell.Navbar>
      )}

      <AppShell.Main>
        <Box px="md" py="md">
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}