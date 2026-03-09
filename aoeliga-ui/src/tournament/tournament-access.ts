import type { TournamentViewer } from "./tournament-types";

export function isTournamentAdmin(viewer?: TournamentViewer | null) {
  return viewer?.tournamentRole === "admin";
}

export function isTournamentModerator(viewer?: TournamentViewer | null) {
  return viewer?.tournamentRole === "moderator";
}

export function isTournamentStaff(viewer?: TournamentViewer | null) {
  return viewer?.tournamentRole === "admin" || viewer?.tournamentRole === "moderator";
}

export function canManageTournament(viewer?: TournamentViewer | null) {
  return viewer?.isGlobalAdmin || viewer?.tournamentRole === "admin";
}

export function canManagePlayers(viewer?: TournamentViewer | null) {
  return viewer?.isGlobalAdmin || isTournamentStaff(viewer);
}