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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function init() {
      let convId: string | null = null;
      if (typeof window !== "undefined") {
        convId = localStorage.getItem(LS_KEY);
      }
      try {
        if (!convId) {
          const boot = await chatApi.boot();
          convId = boot.conversationId;
          if (typeof window !== "undefined") {
            localStorage.setItem(LS_KEY, convId);
          }
        }
        setConversationId(convId);
        setMessages([
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Hola, soy AURA. ¿Cómo te sientes hoy?"
          }
        ]);
      } catch {
        setMessages([
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "No pude conectar con el servicio por ahora. Prueba iniciar sesión nuevamente o revisar el estado en /status."
          }
        ]);
      }
    }
    init();
  }, []);

  async function sendMessage() {
    if (!conversationId) return;
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Msg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await chatApi.send(conversationId, text);
      const assistantMsg: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.reply
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errMsg: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "No pude responder en este momento. Intenta nuevamente."
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-slate-950 text-white">
      <Header />
      <main className="flex-1 flex justify-center px-4 py-4">
        <div className="w-full max-w-2xl flex flex-col gap-4">
          <Card className="flex-1 flex flex-col h-[70vh] overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-2 p-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[80%] rounded-2xl bg-blue-600 px-3 py-2 text-sm"
                      : "mr-auto max-w-[80%] rounded-2xl bg-slate-800 px-3 py-2 text-sm"
                  }
                >
                  {m.content}
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-sm text-slate-400">
                  Conectando con AURA...
                </div>
              )}
            </div>
            <div className="border-t border-slate-800 p-3 flex gap-2 items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !sending && sendMessage()
                }
                placeholder="Escribe tu mensaje…"
                disabled={sending || !conversationId}
              />
              <Button onClick={sendMessage} disabled={sending || !conversationId}>
                {sending ? "Enviando…" : "Enviar"}
              </Button>
            </div>
          </Card>
          <div className="text-xs text-slate-500 text-center">
            Las conversaciones se guardan asociadas a tu usuario demo. Más
            adelante se usarán para construir tu perfil de bienestar.
          </div>
        </div>
      </main>
    </div>
  );
}
