"use client";

import { useEffect, useRef, useState } from "react";
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
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (saved) void attachSession(saved);
  }, []);

  async function startChat() {
    const boot = await chatApi.boot();
    const id = boot.conversationId;
    localStorage.setItem(LS_KEY, id);
    await attachSession(id);
  }

  async function attachSession(id: string) {
    setSessionId(id);
    try {
      const hist = await chatApi.history(id);
      setMessages(
        hist.map(h => ({
          id: h.id,
          role: (h.role === "user" ? "user" : "assistant") as "user" | "assistant",
          content: h.content
        }))
      );
    } catch {
      setMessages([]);
    }
    let canceled = false;
    const timer = setInterval(async () => {
  if (!id) return;
  try {
    const n = await chatApi.nudge(id, 60);
    if (n.due && n.prompt) {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: n.prompt! },
      ]);
    }
  } catch {
    // silenciar
  }
}, 60_000);
    return () => {
      canceled = true;
      clearInterval(timer);
    };
  }

  async function sendMessage() {
    if (!sessionId) return;
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    try {
      const res = await chatApi.send(sessionId, text);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: res.reply }]);
    } catch (e) {
  const msg = e instanceof Error ? e.message : "No pude enviar el mensaje. Intenta nuevamente.";
  setMessages((prev) => [
    ...prev,
    { id: crypto.randomUUID(), role: "assistant", content: `⚠️ ${msg}` },
  ]);
    } finally {
      setSending(false);
    }
  }

  function resetSession() {
    localStorage.removeItem(LS_KEY);
    setSessionId(null);
    setMessages([]);
  }

  return (
  <div className="min-h-dvh flex flex-col">
    <Header user="Matías" />
    <div className="flex-1 px-4 py-6">
      <div className="max-w-xl mx-auto space-y-4">
        <Card className="p-4">
          {messages.length === 0 && (
            <div className="text-center text-brand-subtext text-sm">Cargando…</div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`my-2 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${m.role==="user"?"bg-brand-primary text-white":"bg-brand-bg text-brand-text border border-brand-border"}`}>
                {m.content}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>

    <div className="w-full border-t border-brand-border bg-white px-4 py-3">
      <div className="max-w-xl mx-auto flex items-center gap-2">
        {!sessionId ? (
          <Button onClick={startChat} className="w-full">Iniciar conversación</Button>
        ) : (
          <>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !sending && sendMessage()}
              placeholder="Escribe tu mensaje…"
              disabled={sending}
            />
            <Button onClick={sendMessage} disabled={sending}>{sending ? "Enviando…" : "Enviar"}</Button>
          </>
        )}
      </div>
    </div>
  </div>
);


}
