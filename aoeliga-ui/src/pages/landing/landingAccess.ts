import type { TournamentListItem } from "../../api/schemas/tournaments";

type LandingAccessInputUser = {
  is_admin?: number | boolean | null;
} | null;

function hasTournamentAdminAccess(tournaments: TournamentListItem[]): boolean {
  return tournaments.some((tournament) => tournament.capabilities?.can_edit === true);
}

export function getLandingNavigationAccess(
  user: LandingAccessInputUser,
  tournaments: TournamentListItem[],
) {
  const isGlobalAdmin = user?.is_admin === 1 || user?.is_admin === true;
  const isTournamentAdminAnywhere = hasTournamentAdminAccess(tournaments);

  return {
    isGlobalAdmin,
    canSeeRulesets: isGlobalAdmin || isTournamentAdminAnywhere,
    canSeeAdmin: isGlobalAdmin,
  };
}