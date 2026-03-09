import { createContext, useContext } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getTournament } from "../api/tournaments";

type TournamentContextValue = {
  tournament: any | null;
  loading: boolean;
  error: boolean;
};

const TournamentContext = createContext<TournamentContextValue | null>(null);

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
        loading: query.isLoading,
        error: query.isError,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) {
    throw new Error("TournamentProvider is missing");
  }
  return ctx;
}