import { z } from "zod";

import { updateTournamentInputSchema } from "../../../api/schemas/tournaments";

export const editTournamentFormSchema = updateTournamentInputSchema.extend({
  description: z.string().optional().or(z.literal("")),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  default_ruleset: z.string(),
});

export type EditTournamentFormValues = z.infer<typeof editTournamentFormSchema>;

export function isoToYmd(iso: string | null): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

export function ymdToMidnightIso(ymd: string): string {
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  const local = new Date(y, m - 1, d, 0, 0, 0, 0);
  return local.toISOString();
}