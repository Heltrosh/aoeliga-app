import { api } from "./client";

export type UserListItem = {
  id: number;
  discord_name: string | null;
  display_name: string | null;
  avatar: string | null;
};

export type UsersListResponse = {
  users: UserListItem[];
};

export function listUsers(): Promise<UsersListResponse> {
  return api.get("/api/users");
}