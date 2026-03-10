import type { TournamentViewer } from "./tournament-types";

export function isGlobalAdmin(viewer: TournamentViewer | null | undefined) {
  return viewer?.is_global_admin === true;
}

export function isTournamentAdmin(viewer: TournamentViewer | null | undefined) {
  return viewer?.tournament_role === "admin";
}

export function isTournamentModerator(viewer: TournamentViewer | null | undefined) {
  return viewer?.tournament_role === "moderator";
}

export function isTournamentStaff(viewer: TournamentViewer | null | undefined) {
  return (
    viewer?.is_global_admin === true ||
    viewer?.tournament_role === "admin" ||
    viewer?.tournament_role === "moderator"
  );
}

export function isTournamentStreamer(viewer: TournamentViewer | null | undefined) {
  return viewer?.is_tournament_streamer === true;
}

export function isTournamentPlayer(viewer: TournamentViewer | null | undefined) {
  return viewer?.is_tournament_player === true;
}

export function canManageTournament(viewer: TournamentViewer | null | undefined) {
  return viewer?.is_global_admin === true || viewer?.tournament_role === "admin";
}

export function canManagePlayers(viewer: TournamentViewer | null | undefined) {
  return (
    viewer?.is_global_admin === true ||
    viewer?.tournament_role === "admin" ||
    viewer?.tournament_role === "moderator"
  );
}

export function canAssignStreamers(viewer: TournamentViewer | null | undefined) {
  return (
    viewer?.is_global_admin === true ||
    viewer?.tournament_role === "admin" ||
    viewer?.tournament_role === "moderator"
  );
}

export function canAssignAdmins(viewer: TournamentViewer | null | undefined) {
  return viewer?.is_global_admin === true || viewer?.tournament_role === "admin";
}

export function canManageMatches(viewer: TournamentViewer | null | undefined) {
  return (
    viewer?.is_global_admin === true ||
    viewer?.tournament_role === "admin" ||
    viewer?.tournament_role === "moderator"
  );
}

export function canAccessStreamerTools(viewer: TournamentViewer | null | undefined) {
  return (
    viewer?.is_global_admin === true ||
    viewer?.tournament_role === "admin" ||
    viewer?.tournament_role === "moderator" ||
    viewer?.is_tournament_streamer === true
  );
}