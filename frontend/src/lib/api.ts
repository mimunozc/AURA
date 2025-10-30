const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const AI_URL = process.env.NEXT_PUBLIC_AI_URL!;

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("aura_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  service: "api" | "ai" = "api"
): Promise<T> {
  const base = service === "api" ? API_URL : AI_URL;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...authHeader(),
    ...(options.headers || {})
  };
  const res = await fetch(`${base}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

// === EXPORTS COMPATIBLES CON TUS PÁGINAS ===
export const apiBase = API_URL;

export const api = {
  checkin: {
    async submit(payload: {
      userId: string;
      date: string;
      mood: string;
      sleep: string;
      energy: string;
      stress: string;
      notes: string;
    }) {
      return await request("/checkin", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }
  },
  journal: {
    async list(userId: string) {
      return await request<{ id: string; text: string; ts: string }[]>(
        `/journal?userId=${encodeURIComponent(userId)}`
      );
    },
    async add(userId: string, text: string) {
      return await request("/journal", {
        method: "POST",
        body: JSON.stringify({ userId, text })
      });
    }
  }
};

export { API_URL, AI_URL };
