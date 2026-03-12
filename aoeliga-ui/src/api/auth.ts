import { api, API_BASE } from "./client";
import { meResponseSchema, type MeResponse } from "./schemas/auth";

export async function fetchMe(): Promise<MeResponse> {
  const json = await api.get("/api/me");
  return meResponseSchema.parse(json);
}

export function login(redirect = "/") {
  const base = API_BASE || window.location.origin;
  const url = new URL("/auth/discord", base);
  url.searchParams.set("redirect", redirect);
  window.location.assign(url.toString());
}

export async function logout() {
  await api.post("/auth/logout");
}