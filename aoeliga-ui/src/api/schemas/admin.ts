import { z } from "zod";

export const adminUserListItemSchema = z.object({
  id: z.number(),
  discord_id: z.string().nullable(),
  discord_name: z.string().nullable(),
  display_name: z.string().nullable(),
  avatar: z.string().nullable(),
  is_admin: z.number(),
  is_banned: z.number(),
  ban_reason: z.string().nullable(),
  created_at: z.string(),
  last_login_at: z.string().nullable(),
});

export const adminUsersListResponseSchema = z.object({
  users: z.array(adminUserListItemSchema),
});

export const adminToggleBanInputSchema = z.object({
  is_banned: z.boolean(),
  ban_reason: z.string().nullable().optional()
});

export const adminOkResponseSchema = z.object({
  ok: z.boolean(),
});

export const adminToggleAdminInputSchema = z.object({
  is_admin: z.boolean(),
});

export type AdminToggleAdminInput = z.infer<typeof adminToggleAdminInputSchema>;
export type AdminUserListItem = z.infer<typeof adminUserListItemSchema>;
export type AdminUsersListResponse = z.infer<typeof adminUsersListResponseSchema>;
export type AdminToggleBanInput = z.infer<typeof adminToggleBanInputSchema>;