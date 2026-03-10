import { createContext } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getTournament } from "../api/tournaments";
import type { Tournament, TournamentViewer } from "./tournament-types";

type TournamentContextValue = {
  tournament: Tournament | null;
  viewer: TournamentViewer | null;
  loading: boolean;
  error: boolean;
};

export const TournamentContext = createContext<TournamentContextValue | null>(null);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const { slug } = useParams();

  const query = useQuery({
    queryKey: ["tournament", slug],
    queryFn: () => getTournament(slug!),
    enabled: !!slug,
  });

  return (
    <TournamentContext.Provider
      value={{
        tournament: query.data?.tournament ?? null,
        viewer: query.data?.viewer ?? null,
        loading: query.isLoading,
        error: query.isError,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}
