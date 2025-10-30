import { API_URL } from "./api";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type BootResponse = {
  conversationId: string;
  id?: string;
};

export const chatApi = {
  async boot(): Promise<BootResponse> {
    const res = await fetch(`${API_URL}/chat/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("no se pudo iniciar chat");
    const data = await res.json();
    return {
      conversationId: data.conversationId || data.id,
      id: data.id,
    };
  },

  async history(conversationId: string): Promise<ChatMessage[]> {
    const res = await fetch(`${API_URL}/chat/${conversationId}/history`);
    if (!res.ok) return [];
    return (await res.json()) as ChatMessage[];
  },

  async send(
    conversationId: string,
    text: string
  ): Promise<{ reply: string }> {
    const res = await fetch(`${API_URL}/chat/${conversationId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("no se pudo enviar");
    return (await res.json()) as { reply: string };
  },

  async nudge(
    conversationId: string,
    seconds: number
  ): Promise<{ due: boolean; prompt?: string }> {
    const res = await fetch(
      `${API_URL}/chat/${conversationId}/nudge?wait=${seconds}`
    );
    if (!res.ok) return { due: false };
    return (await res.json()) as { due: boolean; prompt?: string };
  },
};
