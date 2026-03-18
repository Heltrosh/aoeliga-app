import { useTournament } from "./useTournament";
import {
  isGlobalAdmin,
  isTournamentAdmin,
  isTournamentModerator,
  isTournamentPlayer,
  isTournamentStaff,
  isTournamentStreamer,
} from "../tournament/tournament-access";

export function useTournamentAccess() {
  const { viewer, capabilities } = useTournament();

  return {
    viewer,
    capabilities,
    isGlobalAdmin: isGlobalAdmin(viewer),
    isTournamentAdmin: isTournamentAdmin(viewer),
    isTournamentModerator: isTournamentModerator(viewer),
    isTournamentStaff: isTournamentStaff(viewer),
    isTournamentStreamer: isTournamentStreamer(viewer),
    isTournamentPlayer: isTournamentPlayer(viewer),
    canManageTournament: capabilities?.can_manage_tournament ?? false,
    canManagePlayers: capabilities?.can_manage_players ?? false,
    canReviewRegistrations: capabilities?.can_manage_players ?? false,
    canAssignAdmins: capabilities?.can_assign_admins ?? false,
    canAssignStreamers: capabilities?.can_assign_streamers ?? false,
    canManageMatches: capabilities?.can_manage_matches ?? false,
    canAccessStreamerTools: capabilities?.can_access_streamer_tools ?? false,
  };
}
