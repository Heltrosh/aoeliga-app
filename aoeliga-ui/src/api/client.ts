const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8787";

type ApiErrorResponse = {
  error?: string;
};

async function parseJsonSafely<T>(res: Response): Promise<T | ApiErrorResponse> {
  return res.json().catch(() => ({}));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const json = await parseJsonSafely<T>(res);

  if (!res.ok) {
    throw new Error(
      (json as ApiErrorResponse)?.error || `HTTP ${res.status}`,
    );
  }

  return json as T;
}

export { API_BASE };

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, {
      method: "GET",
    });
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },

  delete<T>(path: string): Promise<T> {
    return request<T>(path, {
      method: "DELETE",
    });
  },
};