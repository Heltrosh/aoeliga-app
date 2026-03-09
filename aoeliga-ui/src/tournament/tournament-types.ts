export type TournamentRole = "admin" | "moderator" | null;

export type TournamentViewer = {
  isAuthenticated: boolean;
  isGlobalAdmin: boolean;
  tournamentRole: TournamentRole;
  isTournamentStreamer: boolean;
  isTournamentPlayer: boolean;
};

export type Tournament = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
};

export type TournamentDetailResponse = {
  tournament: Tournament;
  viewer?: TournamentViewer;
};