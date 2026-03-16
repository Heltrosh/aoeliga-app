import { z } from "zod";

import { createTournamentInputSchema } from "../../../api/schemas/tournaments";

export const createTournamentFormSchema = createTournamentInputSchema.extend({
  description: z.string().optional().or(z.literal("")),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  default_ruleset: z.string(),
});

export type CreateTournamentFormValues = z.infer<
  typeof createTournamentFormSchema
>;

export function ymdToMidnightIso(ymd: string): string {
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  const local = new Date(y, m - 1, d, 0, 0, 0, 0);
  return local.toISOString();
}