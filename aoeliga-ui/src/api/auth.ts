import { api, API_BASE } from "./client";
import type { MeResponse } from "../auth/auth-types";

export function fetchMe(): Promise<MeResponse> {
  return api.get("/api/me");
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