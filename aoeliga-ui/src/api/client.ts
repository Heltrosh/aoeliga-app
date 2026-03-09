export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function request(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);

  const hasBody = init?.body !== undefined && init?.body !== null;

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(API_BASE + path, {
    credentials: "include",
    ...init,
    headers,
  });

  if (!res.ok) {
    let message = res.statusText;

    try {
      const data = await res.json();
      message = data?.error ?? message;
    } catch {
      // ignore JSON parse failure
    }

    throw new Error(message || "Request failed");
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body?: unknown) =>
    request(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: (path: string, body?: unknown) =>
    request(path, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: (path: string, body?: unknown) =>
    request(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  del: (path: string) =>
    request(path, {
      method: "DELETE",
    }),
};