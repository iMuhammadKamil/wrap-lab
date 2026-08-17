export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || body.success !== true) {
    if (res.status === 401) {
      window.location.replace("/");
    }
    throw new ApiError(body?.error ?? `Request failed (${res.status})`, res.status);
  }

  return body.data as T;
}