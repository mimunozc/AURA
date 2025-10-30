// src/app/chat/page.tsx
"use client";

import { useEffect, useState } from "react";
import { chatApi } from "@/lib/chat";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

type Msg = { id: string; role: "user" | "assistant"; content: string };
const LS_KEY = "aura_conversation_id";

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // al montar: intentar recuperar conversación guardada
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      // por ahora no pedimos historial porque la API no tiene /history
      setSessionId(saved);
    }
  }, []);

  async function startChat() {
    try {
      const boot = await chatApi.boot();
      const id = boot.conversationId;
      localStorage.setItem(LS_KEY, id);
      setSessionId(id);
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Hola 👋 ¿en qué te puedo ayudar hoy?",
        },
      ]);
    } catch (err) {
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "⚠️ No pude iniciar la conversación. Intenta de nuevo.",
        },
      ]);
    }
  }

  async function sendMessage() {
    if (!sessionId) return;
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    // agrego mensaje del usuario
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
    ]);

    try {
      const res = await chatApi.send(sessionId, text);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: res.reply },
      ]);
    } catch (e) {
      // si falló, borro la conversación guardada porque puede ser un GUID viejo
      if (typeof window !== "undefined") {
        localStorage.removeItem(LS_KEY);
      }
      setSessionId(null);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "⚠️ No se pudo enviar el mensaje. Inicia otra conversación.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function resetSession() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LS_KEY);
    }
    setSessionId(null);
    setMessages([]);
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <Header user="Matías" />

      <div className="flex-1 px-4 py-6">
        <div className="max-w-xl mx-auto space-y-4">
          <Card className="p-4 min-h-[300px]">
            {messages.length === 0 && (
              <div className="text-center text-brand-subtext text-sm">
                {sessionId
                  ? "Conversación lista, escribe tu mensaje…"
                  : "Inicia una conversación para hablar con AURA."}
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`my-2 flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-indigo-500 text-white"
                      : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </Card>

          {sessionId && (
            <button
              onClick={resetSession}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Limpiar conversación
            </button>
          )}
        </div>
      </div>

      <div className="w-full border-t border-brand-border bg-white px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          {!sessionId ? (
            <Button onClick={startChat} className="w-full">
              Iniciar conversación
            </Button>
          ) : (
            <>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !sending && sendMessage()}
                placeholder="Escribe tu mensaje…"
                disabled={sending}
              />
              <Button onClick={sendMessage} disabled={sending}>
                {sending ? "Enviando…" : "Enviar"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
