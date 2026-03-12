import { z } from "zod";

export const authUserSchema = z.object({
  id: z.number(),
  discord_id: z.string(),
  discord_name: z.string().nullable(),
  display_name: z.string().nullable(),
  avatar: z.string().nullable(),
  is_admin: z.number(),
  is_banned: z.number(),
});

export const meResponseSchema = z.object({
  user: authUserSchema.nullable()
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;