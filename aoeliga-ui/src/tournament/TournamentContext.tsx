import { createContext } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { tournamentKeys } from "../api/queryKeys";
import { getTournamentBySlug } from "../api/tournaments";
import type { Tournament, TournamentCapabilities, TournamentViewer } from "./tournament-types";

type TournamentContextValue = {
  tournament: Tournament | null;
  viewer: TournamentViewer | null;
  capabilities: TournamentCapabilities | null;
  loading: boolean;
  error: boolean;
};

export const TournamentContext = createContext<TournamentContextValue | null>(null);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const { slug } = useParams();

  const query = useQuery({
    queryKey: slug ? tournamentKeys.context(slug) : ["tournaments", "missing-slug", "context"],
    queryFn: () => getTournamentBySlug(slug!),
    enabled: !!slug,
  });

  return (
    <TournamentContext.Provider
      value={{
        tournament: query.data?.tournament ?? null,
        viewer: query.data?.viewer ?? null,
        capabilities: query.data?.capabilities ?? null,
        loading: query.isLoading,
        error: query.isError,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}
