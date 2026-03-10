import { useContext } from "react";
import { TournamentHeaderContext } from "../tournament/TournamentHeaderContext";

export function useTournamentHeader() {
  const ctx = useContext(TournamentHeaderContext);
  if (!ctx) {
    throw new Error("TournamentHeaderProvider is missing");
  }
  return ctx;
}