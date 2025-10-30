// src/lib/chat.ts
import { API_URL } from "./api";

export const chatApi = {
  async boot() {
    const res = await fetch(`${API_URL}/chat/start`, { method: "POST" });
    if (!res.ok) throw new Error("No se pudo iniciar la conversación");
    return (await res.json()) as { conversationId: string };
  },

  async send(conversationId: string, message: string) {
    const res = await fetch(`${API_URL}/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, message }),
    });
    if (!res.ok) throw new Error("No se pudo enviar el mensaje");
    return (await res.json()) as { reply: string };
  },
};
