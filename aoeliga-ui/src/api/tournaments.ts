import { api } from "./client";

export function listTournaments() {
  return api.get("/api/tournaments");
}

export function getTournament(slug: string) {
  return api.get(`/api/tournaments/${slug}`);
}

export function createTournament(body: {
  slug: string;
  name: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
}) {
  return api.post("/api/admin/tournaments", body);
}