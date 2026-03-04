export type MeResponse = {
  user: null | {
    id: number;
    discord_id: string;
    username: string | null;
    global_name: string | null;
    avatar: string | null;
    is_admin: number;
  };
};

export async function apiGetMe(): Promise<MeResponse> {
  const res = await fetch("/api/me", { credentials: "include" });
  if (!res.ok) throw new Error(`GET /api/me failed (${res.status})`);
  return res.json();
}

export async function apiLogout(): Promise<void> {
  const res = await fetch("/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`POST /auth/logout failed (${res.status})`);
}

export function startDiscordLogin(redirectTo: string) {
  const url = `/auth/discord?redirect=${encodeURIComponent(redirectTo)}`;
  window.location.assign(url);
}