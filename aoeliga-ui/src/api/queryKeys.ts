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

export const rulesetKeys = {
  all: ["rulesets"] as const,
  list: () => ["rulesets", "list"] as const,
  detail: (id: number | null) => ["rulesets", "detail", id] as const,
};

export const adminKeys = {
  all: ["admin"] as const,
  users: (query: string) => ["admin", "users", query] as const,
};