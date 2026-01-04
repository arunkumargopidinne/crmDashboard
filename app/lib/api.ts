import { getFirebaseAuth } from "./firebase";

type ApiFetchOptions = RequestInit & {
  // Use if you want to call external backend. If not provided, uses relative `/api`.
  baseUrl?: string;
  // treat these HTTP statuses as successful (e.g. 207 Multi-Status)
  allowedStatuses?: number[];
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { baseUrl, headers, allowedStatuses = [], ...rest } = options;

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

  if (!res.ok && !allowedStatuses.includes(res.status)) {
    throw new Error(data?.message || "Request failed");
  }

  return data as T;
}
