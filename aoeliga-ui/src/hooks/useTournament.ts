import { useContext } from "react";
import { TournamentContext } from "../tournament/TournamentContext";

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) {
    throw new Error("TournamentProvider is missing");
  }
  return ctx;
}