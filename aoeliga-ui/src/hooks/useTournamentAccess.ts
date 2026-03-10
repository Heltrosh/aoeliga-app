import { useTournament } from "./useTournament";
import {
  isGlobalAdmin,
  isTournamentAdmin,
  isTournamentModerator,
  isTournamentStaff,
  isTournamentStreamer,
  isTournamentPlayer,
  canManageTournament,
  canManagePlayers,
  canAssignAdmins,
  canAssignStreamers,
  canManageMatches,
  canAccessStreamerTools,
} from "../tournament/tournament-access";

export function useTournamentAccess() {
  const { viewer } = useTournament();

  return {
    viewer,
    isGlobalAdmin: isGlobalAdmin(viewer),
    isTournamentAdmin: isTournamentAdmin(viewer),
    isTournamentModerator: isTournamentModerator(viewer),
    isTournamentStaff: isTournamentStaff(viewer),
    isTournamentStreamer: isTournamentStreamer(viewer),
    isTournamentPlayer: isTournamentPlayer(viewer),
    canManageTournament: canManageTournament(viewer),
    canManagePlayers: canManagePlayers(viewer),
    canAssignAdmins: canAssignAdmins(viewer),
    canAssignStreamers: canAssignStreamers(viewer),
    canManageMatches: canManageMatches(viewer),
    canAccessStreamerTools: canAccessStreamerTools(viewer),
  };
}