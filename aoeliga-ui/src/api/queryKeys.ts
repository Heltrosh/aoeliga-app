export const tournamentKeys = {
  all: ["tournaments"] as const,
  bySlug: (slug: string) => ["tournaments", slug] as const,
  context: (slug: string) => ["tournaments", slug, "context"] as const,
  admins: (slug: string) => ["tournaments", slug, "admins"] as const,
  streamers: (slug: string) => ["tournaments", slug, "streamers"] as const,
  players: (slug: string) => ["tournaments", slug, "players"] as const,
};

export const userKeys = {
  all: ["users"] as const,
  list: () => ["users", "list"] as const,
};
