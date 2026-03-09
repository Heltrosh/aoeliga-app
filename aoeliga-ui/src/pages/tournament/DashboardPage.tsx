import { Text, Title } from "@mantine/core";
import { useTournament } from "../../tournament/TournamentContext";

export default function DashboardPage() {
  const { tournament } = useTournament();

  return (
    <>
      <Title order={2}>{tournament?.name ?? "Tournament"}</Title>
      <Text c="dimmed">Tournament dashboard placeholder.</Text>
    </>
  );
}