import type { Env } from "./env";
import type { AuthUser } from "../domain/auth";
import type { TournamentRow } from "../domain/tournament";
import type { TournamentRole } from "../domain/statuses";

export type AppBindings = {
  Bindings: Env;
  Variables: {
    user: AuthUser | null;
    tournament: TournamentRow | null;
    tournamentRole: TournamentRole | null;
    isTournamentStreamer: boolean;
    isTournamentPlayer: boolean;
  };
};