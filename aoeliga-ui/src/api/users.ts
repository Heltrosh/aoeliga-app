import { api } from "./client";
import { usersListResponseSchema, type UserListItem, type UsersListResponse } from "./schemas/users";

export type { UserListItem, UsersListResponse };

export async function listUsers(): Promise<UsersListResponse> {
  const json = await api.get("/api/users");
  return usersListResponseSchema.parse(json);
}
