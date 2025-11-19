import { request } from "./api";

export const chatApi = {
  async boot() {
    return await request<{ conversationId: string }>("/chat/start", {
      method: "POST"
    });
  },

  async send(conversationId: string, message: string) {
    return await request<{ reply: string }>("/chat/send", {
      method: "POST",
      body: JSON.stringify({ conversationId, message })
    });
  }
};
