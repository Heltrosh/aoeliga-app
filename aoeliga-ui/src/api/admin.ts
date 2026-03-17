import { api } from "./client";
import {
  adminOkResponseSchema,
  adminToggleBanInputSchema,
  adminUsersListResponseSchema,
  type AdminToggleAdminInput,
  type AdminToggleBanInput,
  type AdminUsersListResponse,
} from "./schemas/admin";

export type { AdminUserListItem, AdminUsersListResponse } from "./schemas/admin";

export async function listAdminUsers(query?: string): Promise<AdminUsersListResponse> {
  const suffix = query?.trim()
    ? `?q=${encodeURIComponent(query.trim())}`
    : "";

  const json = await api.get(`/api/admin/users${suffix}`);
  return adminUsersListResponseSchema.parse(json);
}

export async function setAdminUserBan(
  userId: number,
  input: AdminToggleBanInput,
): Promise<void> {
  const payload = adminToggleBanInputSchema.parse(input);
  const json = await api.patch(`/api/admin/users/${userId}/ban`, payload);
  adminOkResponseSchema.parse(json);
}

import { adminToggleAdminInputSchema } from "./schemas/admin";

export async function setAdminUserAdmin(
  userId: number,
  input: AdminToggleAdminInput,
): Promise<void> {
  const payload = adminToggleAdminInputSchema.parse(input);
  const json = await api.patch(`/api/admin/users/${userId}/admin`, payload);
  adminOkResponseSchema.parse(json);
}

