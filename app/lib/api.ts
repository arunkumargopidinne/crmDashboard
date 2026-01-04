import { getFirebaseAuth } from "./firebase";

type ApiFetchOptions = RequestInit & {
  // Use if you want to call external backend. If not provided, uses relative `/api`.
  baseUrl?: string;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { baseUrl, headers, ...rest } = options;

  const user = getFirebaseAuth()?.currentUser ?? null;
  const token = user ? await user.getIdToken() : null;

  const res = await fetch(`${baseUrl ?? ""}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data as T;
}
