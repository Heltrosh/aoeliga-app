import { AppShell, NavLink } from "@mantine/core";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";

export default function TournamentLayout() {
  const { slug } = useParams();
  const nav = useNavigate();
  const loc = useLocation();

  const base = `/t/${slug}`;

  const items = [
    { label: "Dashboard", to: `${base}/dashboard` },
    { label: "Divisions", to: `${base}/divisions` },
    { label: "Schedule", to: `${base}/schedule` },
    { label: "Players", to: `${base}/players` },
  ];

  return (
    <AppShell
      navbar={{ width: 250, breakpoint: "sm" }}
      padding="md"
    >
      <AppShell.Navbar p="md">
        {items.map((it) => (
          <NavLink
            key={it.to}
            label={it.label}
            active={loc.pathname === it.to}
            onClick={() => nav(it.to)}
            color="gold"
            variant="light"
            mb={6}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}