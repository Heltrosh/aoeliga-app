export type TournamentRole = "admin" | "moderator" | null;

export type TournamentViewer = {
  is_authenticated: boolean;
  is_global_admin: boolean;
  tournament_role: TournamentRole;
  is_tournament_streamer: boolean;
  is_tournament_player: boolean;
};

export type Tournament = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at?: string; 
};

export type TournamentDetailResponse = {
  tournament: Tournament;
  viewer: TournamentViewer;
};