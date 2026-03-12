import { z } from "zod";

export const userListItemSchema = z.object({
  id: z.number(),
  discord_id: z.string().nullable(),
  discord_name: z.string().nullable(),
  display_name: z.string().nullable(),
  avatar: z.string().nullable(),
});

export const usersListResponseSchema = z.object({
  users: z.array(userListItemSchema),
});

export type UserListItem = z.infer<typeof userListItemSchema>;
export type UsersListResponse = z.infer<typeof usersListResponseSchema>;
