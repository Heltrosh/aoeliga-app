import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createTournament, listTournaments, updateTournament, deleteTournament } from "../api/tournaments";
import { tournamentKeys } from "../api/queryKeys";
import type { CreateTournamentInput, UpdateTournamentInput } from "../api/schemas/tournaments";

export function useLandingPage() {
  const qc = useQueryClient();

  const tournamentsQuery = useQuery({
    queryKey: tournamentKeys.all,
    queryFn: listTournaments,
  });

  const createTournamentMutation = useMutation({
    mutationFn: (input: CreateTournamentInput) => createTournament(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: tournamentKeys.all });
    },
  });

  const updateTournamentMutation = useMutation({
    mutationFn: ({
      slug,
      input,
    }: {
      slug: string;
      input: UpdateTournamentInput;
    }) => updateTournament(slug, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: tournamentKeys.all });
    },
  });

  const deleteTournamentMutation = useMutation({
    mutationFn: (slug: string) => deleteTournament(slug),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: tournamentKeys.all });
    },
  });

  return {
    tournamentsQuery,
    createTournamentMutation,
    updateTournamentMutation,
    deleteTournamentMutation
  };
}