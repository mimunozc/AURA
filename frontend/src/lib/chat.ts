import { request } from "./api"

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

export type BootResponse = {
  session_id: string
  messages: ChatMessage[]
}

export const chatApi = {
  boot: () => request<BootResponse>("/chat/boot", {}, "api"),
  history: (sessionId: string) =>
    request<ChatMessage[]>(`/chat/history/${sessionId}`, {}, "api"),
  send: (sessionId: string | null, message: string) =>
    request<{ session_id: string; reply: ChatMessage }>(
      "/chat/send",
      {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId, message })
      },
      "api"
    )
}
