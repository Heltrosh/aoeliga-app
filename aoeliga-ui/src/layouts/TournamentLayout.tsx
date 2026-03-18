import { useEffect, useMemo } from "react";
import { Box, Center, Loader, NavLink, Stack, Text } from "@mantine/core";
import {
  IconLayoutDashboard,
  IconStack2,
  IconCalendarEvent,
  IconUsers,
  IconSettings,
  IconUserPlus,
} from "@tabler/icons-react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";

import { TournamentProvider } from "../tournament/TournamentContext";
import { useTournament } from "../hooks/useTournament";
import { useTournamentAccess } from "../hooks/useTournamentAccess";
import { useTournamentHeader } from "../hooks/useTournamentHeader";
import { useI18n } from "../i18n/I18nProvider";

type TournamentNavItem = {
  label: string;
  to: string;
  icon: React.ReactNode;
};

function useTournamentNavItems(base: string) {
  const { t } = useI18n();
  const access = useTournamentAccess();
  const { tournament, viewer } = useTournament();

  return useMemo<TournamentNavItem[]>(() => {
    const items: TournamentNavItem[] = [
      {
        label: t("tournament.nav.dashboard"),
        to: `${base}/dashboard`,
        icon: <IconLayoutDashboard size={18} />,
      },
      {
        label: t("tournament.nav.divisions"),
        to: `${base}/divisions`,
        icon: <IconStack2 size={18} />,
      },
      {
        label: t("tournament.nav.schedule"),
        to: `${base}/schedule`,
        icon: <IconCalendarEvent size={18} />,
      },
      {
        label: t("tournament.nav.players"),
        to: `${base}/players`,
        icon: <IconUsers size={18} />,
      },
    ];

    const showSignup =
      !!viewer?.is_authenticated &&
      (
        (tournament?.status === "signup" && (tournament?.registrations_open ?? 0) === 1) ||
        ((access.isTournamentAdmin || access.isTournamentModerator) &&
          (tournament?.status === "draft" || tournament?.status === "signup"))
      );

    if (showSignup) {
      items.push({
        label: "Signup",
        to: `${base}/signup`,
        icon: <IconUserPlus size={18} />,
      });
    }

    if (access.canManageTournament || access.isTournamentModerator) {
      items.push({
        label: t("tournament.nav.administration"),
        to: `${base}/admin`,
        icon: <IconSettings size={18} />,
      });
    }

    return items;
  }, [
    access.canManageTournament,
    access.isTournamentAdmin,
    access.isTournamentModerator,
    base,
    t,
    tournament?.registrations_open,
    tournament?.status,
    viewer?.is_authenticated,
  ]);
}

function isNavItemActive(pathname: string, itemTo: string) {
  return pathname === itemTo || pathname.startsWith(`${itemTo}/`);
}


function TournamentPageLoading() {
  return (
    <Center style={{ minHeight: "calc(100vh - 60px)" }}>
      <Stack align="center" gap="sm">
        <Loader color="yellow" />
        <Text c="dimmed" size="sm">
          Loading tournament...
        </Text>
      </Stack>
    </Center>
  );
}

function TournamentPageError() {
  return (
    <Center style={{ minHeight: "calc(100vh - 60px)" }}>
      <Text c="red">Failed to load tournament.</Text>
    </Center>
  );
}

function TournamentChrome() {
  const nav = useNavigate();
  const loc = useLocation();
  const { slug } = useParams();
  const { tournament, loading, error } = useTournament();
  const { setTitle } = useTournamentHeader();

  useEffect(() => {
    setTitle(tournament?.name ?? null);
    return () => setTitle(null);
  }, [setTitle, tournament?.name]);

  const base = slug ? `/t/${slug}` : "";
  const navItems = useTournamentNavItems(base);

  if (loading) {
    return <TournamentPageLoading />;
  }

  if (error || !tournament) {
    return <TournamentPageError />;
  }

  return (
    <Box
      style={{
        display: "grid",
        gridTemplateColumns: "250px 1fr",
        minHeight: "calc(100vh - 60px)",
      }}
    >
      <Box
        p="xs"
        style={{
          background: "rgba(21,31,40,0.45)",
          backdropFilter: "blur(10px)",
          borderRight: "1px solid rgba(229,154,42,0.10)",
          boxShadow: "inset -1px 0 0 rgba(229,154,42,0.10)",
        }}
      >
        {navItems.map((item) => {
          const active = isNavItemActive(loc.pathname, item.to);

          return (
            <NavLink
              key={item.to}
              label={item.label}
              leftSection={item.icon}
              active={active}
              onClick={() => nav(item.to)}
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
                  color: active
                    ? "rgba(255,191,84,0.95)"
                    : "rgba(221,226,234,0.82)",
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
      </Box>

      <Box px="md" py="md">
        <Outlet />
      </Box>
    </Box>
  );
}

export default function TournamentLayout() {
  return (
    <TournamentProvider>
      <TournamentChrome />
    </TournamentProvider>
  );
}