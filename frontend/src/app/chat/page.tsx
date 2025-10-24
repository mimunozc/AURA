"use client";

import { useEffect, useState } from "react";
import { chatApi, ChatMessage } from "@/lib/chat";

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  // Boot al entrar a la vista
  useEffect(() => {
    (async () => {
      try {
        const boot = await chatApi.boot();
        setSessionId(boot.session_id);
        setMessages(boot.messages ?? []);
      } catch (e) {
        console.error("chat boot error", e);
      }
    })();
  }, []);

  async function send() {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");

    // pinta optimista el mensaje del usuario
    const tempUser: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, tempUser]);

    try {
      const res = await chatApi.send(sessionId, text);
      if (!sessionId) setSessionId(res.session_id);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUser.id),
        tempUser,
        res.reply,
      ]);
    } catch (e) {
      console.error("chat send error", e);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-3">Chat</h1>

      <div className="border rounded p-3 h-96 overflow-auto mb-3">
        {messages.map((m) => (
          <div key={m.id} className="mb-2">
            <strong>{m.role === "user" ? "Tú" : "AURA"}:</strong> {m.content}
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-gray-500">Empieza la conversación…</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escribe tu mensaje…"
        />
        <button className="bg-blue-600 text-white px-4 rounded" onClick={send}>
          Enviar
        </button>
      </div>
    </div>
  );
}
