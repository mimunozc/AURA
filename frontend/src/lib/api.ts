const API_URL = process.env.NEXT_PUBLIC_API_URL!
const AI_URL = process.env.NEXT_PUBLIC_AI_URL!

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const token = localStorage.getItem("aura_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  service: "api" | "ai" = "api"
): Promise<T> {
  const base = service === "api" ? API_URL : AI_URL
  const headers = {
    "Content-Type": "application/json",
    ...authHeader(),
    ...(options.headers || {})
  }
  const res = await fetch(`${base}${path}`, { ...options, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`)
  }
  return (await res.json()) as T
}

export { API_URL, AI_URL }
