import { useQuery } from "@tanstack/react-query";

import { tournamentKeys, userKeys } from "../api/queryKeys";
import { getTournamentAdmins, getTournamentPlayers, getTournamentStreamers } from "../api/tournaments";
import { listUsers } from "../api/users";

export function useTournamentAdminData(slug: string | undefined) {
  const usersQuery = useQuery({
    queryKey: userKeys.list(),
    queryFn: listUsers,
  });

  const adminsQuery = useQuery({
    queryKey: slug ? tournamentKeys.admins(slug) : ["tournaments", "missing-slug", "admins"],
    queryFn: () => getTournamentAdmins(slug!),
    enabled: !!slug,
  });

  const streamersQuery = useQuery({
    queryKey: slug ? tournamentKeys.streamers(slug) : ["tournaments", "missing-slug", "streamers"],
    queryFn: () => getTournamentStreamers(slug!),
    enabled: !!slug,
  });

  const playersQuery = useQuery({
    queryKey: slug ? tournamentKeys.players(slug) : ["tournaments", "missing-slug", "players"],
    queryFn: () => getTournamentPlayers(slug!),
    enabled: !!slug,
  });

  return {
    usersQuery,
    adminsQuery,
    streamersQuery,
    playersQuery,
    users: usersQuery.data?.users ?? [],
    adminMembers: adminsQuery.data?.admins ?? [],
    streamerMembers: streamersQuery.data?.streamers ?? [],
    playerMembers: playersQuery.data?.players ?? [],
    isLoading:
      usersQuery.isLoading ||
      adminsQuery.isLoading ||
      streamersQuery.isLoading ||
      playersQuery.isLoading,
  };
}
