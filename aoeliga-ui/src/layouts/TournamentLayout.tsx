import { Box, NavLink } from "@mantine/core";
import { IconLayoutDashboard, IconStack2, IconCalendarEvent, IconUsers, IconSettings } from "@tabler/icons-react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";

import { TournamentProvider } from "../tournament/TournamentContext";
import { useTournament } from "../hooks/useTournament";
import { useTournamentAccess } from "../hooks/useTournamentAccess";
import { useTournamentHeader } from "../hooks/useTournamentHeader";
import { useI18n } from "../i18n/I18nProvider";

function TournamentChrome() {
  const nav = useNavigate();
  const loc = useLocation();
  const { slug } = useParams();
  const { tournament } = useTournament();
  const { setTitle } = useTournamentHeader();
  const { t } = useI18n();
  const access = useTournamentAccess();
  
  

  useEffect(() => {
    setTitle(tournament?.name ?? null);
    return () => setTitle(null);
  }, [tournament?.name, setTitle]);

  const base = slug ? `/t/${slug}` : "";

  const navItems = [
    { label: t("nav.dashboard"), to: `${base}/dashboard`, icon: <IconLayoutDashboard size={18} /> },
    { label: t("nav.divisions"), to: `${base}/divisions`, icon: <IconStack2 size={18} /> },
    { label: t("nav.schedule"), to: `${base}/schedule`, icon: <IconCalendarEvent size={18} /> },
    { label: t("nav.players"), to: `${base}/players`, icon: <IconUsers size={18} /> },
    ...(access.canManageTournament || access.isTournamentModerator
    ? [{ label: t("nav.administration"), to: `${base}/admin`, icon: <IconSettings size={18} /> }]
    : []),
  ];

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