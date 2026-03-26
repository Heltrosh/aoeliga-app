import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { rulesetKeys, tournamentKeys } from "../api/queryKeys";
import { fetchRulesets } from "../api/rulesets";
import {
  applyTournamentSetup,
  generateTournamentSetupAssignments,
  generateTournamentSetupMatches,
  getTournamentSetup,
  replaceTournamentSetupAssignments,
  replaceTournamentSetupMatches,
  updateTournamentSetupDivisions,
} from "../api/tournamentSetup";
import type {
  GenerateSetupAssignmentsInput,
  ReplaceSetupAssignmentsInput,
  ReplaceSetupMatchesInput,
  TournamentSetup,
  UpdateSetupDivisionsInput,
} from "../api/schemas/tournamentSetup";

function invalidateTournamentCaches(qc: ReturnType<typeof useQueryClient>, slug: string) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: tournamentKeys.context(slug) }),
    qc.invalidateQueries({ queryKey: tournamentKeys.players(slug) }),
    qc.invalidateQueries({ queryKey: tournamentKeys.setup(slug) }),
  ]);
}

export function useTournamentSetup(slug: string | undefined) {
  const qc = useQueryClient();

  const setupQuery = useQuery({
    queryKey: slug ? tournamentKeys.setup(slug) : ["tournaments", "missing-slug", "setup"],
    queryFn: () => getTournamentSetup(slug as string),
    enabled: !!slug,
  });

  const rulesetsQuery = useQuery({
    queryKey: rulesetKeys.list(),
    queryFn: fetchRulesets,
  });

  const setSetup = async (setup: TournamentSetup) => {
    if (!slug) return;
    qc.setQueryData(tournamentKeys.setup(slug), setup);
    await invalidateTournamentCaches(qc, slug);
  };

  const updateDivisionsMutation = useMutation({
    mutationFn: (input: UpdateSetupDivisionsInput) =>
      updateTournamentSetupDivisions(slug as string, input),
    onSuccess: setSetup,
  });

  const generateAssignmentsMutation = useMutation({
    mutationFn: (input: GenerateSetupAssignmentsInput) =>
      generateTournamentSetupAssignments(slug as string, input),
    onSuccess: setSetup,
  });

  const replaceAssignmentsMutation = useMutation({
    mutationFn: (input: ReplaceSetupAssignmentsInput) =>
      replaceTournamentSetupAssignments(slug as string, input),
    onSuccess: setSetup,
  });

  const generateMatchesMutation = useMutation({
    mutationFn: () => generateTournamentSetupMatches(slug as string),
    onSuccess: setSetup,
  });

  const replaceMatchesMutation = useMutation({
    mutationFn: (input: ReplaceSetupMatchesInput) =>
      replaceTournamentSetupMatches(slug as string, input),
    onSuccess: setSetup,
  });

  const applySetupMutation = useMutation({
    mutationFn: () => applyTournamentSetup(slug as string),
    onSuccess: setSetup,
  });

  return {
    setupQuery,
    rulesetsQuery,
    setup: setupQuery.data ?? null,
    rulesets: rulesetsQuery.data ?? [],
    updateDivisionsMutation,
    generateAssignmentsMutation,
    replaceAssignmentsMutation,
    generateMatchesMutation,
    replaceMatchesMutation,
    applySetupMutation,
    isLoading: setupQuery.isLoading || rulesetsQuery.isLoading,
  };
}
