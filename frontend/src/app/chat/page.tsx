"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { chatApi } from "@/lib/chat";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/identity";
import { useSearchParams } from "next/navigation";

type Msg = { id: string; role: "user" | "assistant"; content: string };
const LS_KEY = "aura_conversation_id";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [activeStepTitle, setActiveStepTitle] = useState<string | null>(null);
  const userId = useMemo(() => getUserId(), []);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [booting, setBooting] = useState(true);
  const [showCheckinPrompt, setShowCheckinPrompt] = useState(false);
  const [checkingCheckin, setCheckingCheckin] = useState(true);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    async function boot() {
      setBooting(true);
      try {
        const stored =
          typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
        if (stored) {
          setConversationId(stored);
        } else {
          const res = await chatApi.boot();
          setConversationId(res.conversationId);
          if (typeof window !== "undefined") {
            localStorage.setItem(LS_KEY, res.conversationId);
          }
        }
      } finally {
        setBooting(false);
      }
    }
    boot();
  }, []);

  useEffect(() => {
  const title = searchParams.get("stepTitle");
  if (title) {
    setActiveStepTitle(title);
  }
}, [searchParams]);

  useEffect(() => {
    async function checkCheckin() {
      setCheckingCheckin(true);
      try {
        const res = await api.request<any>(
          `/checkin/by-date?userId=${encodeURIComponent(
            userId
          )}&date=${encodeURIComponent(today)}`
        );
        if (!res) {
          setShowCheckinPrompt(true);
        }
      } catch {
      } finally {
        setCheckingCheckin(false);
      }
    }
    checkCheckin();
  }, [userId, today]);

  async function sendMessage() {
    if (!conversationId) return;
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Msg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await chatApi.send(conversationId, text);
      const assistantMsg: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.reply
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Ocurrió un error al enviar tu mensaje. Intenta nuevamente."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  }

function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Chat con AURA</h1>
              <p className="text-sm text-brand-subtext">
                Conversa con AURA y recibe apoyo según tu contexto emocional.
              </p>
            </div>
            <Link href="/status">
              <Button type="button" className="text-sm">
                Ver dashboard
              </Button>
            </Link>
          </div>

          {activeStepTitle && (
  <Card className="p-3 border border-brand-border bg-brand-card">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      <div>
        <div className="text-sm font-medium">
          Estás trabajando un paso de tu guía adaptativa
        </div>
        <div className="text-xs text-brand-subtext">
          Paso: {activeStepTitle}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          className="text-sm"
          onClick={() => setActiveStepTitle(null)}
        >
          Terminar paso
        </Button>
      </div>
    </div>
  </Card>
)}


          {showCheckinPrompt && (
            <Card className="p-3 border border-brand-border bg-brand-card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">
                    Aún no has hecho tu Mood Check-in de hoy
                  </div>
                  <div className="text-xs text-brand-subtext">
                    Toma 30 segundos para registrar cómo estás. Esto ayuda a que
                    AURA entienda mejor tu contexto.
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Link href="/checkin">
                    <Button type="button" className="text-sm">
                      Hacer check-in ahora
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    className="text-sm"
                    onClick={() => setShowCheckinPrompt(false)}
                  >
                    Más tarde
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4 space-y-4">
            <div className="h-80 overflow-y-auto border border-brand-border rounded-xl bg-brand-card px-3 py-2 space-y-2">
              {booting && (
                <div className="text-xs text-brand-subtext">
                  Iniciando conversación...
                </div>
              )}
              {!booting && messages.length === 0 && (
                <div className="text-xs text-brand-subtext">
                  Aún no hay mensajes. Cuéntale a AURA cómo te sientes hoy o qué
                  necesitas.
                </div>
              )}
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-brand-primary text-white"
                        : "bg-brand-bg-soft text-brand-text border border-brand-border"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <Input
                value={input}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje para AURA..."
              />
              <Button
                type="button"
                onClick={sendMessage}
                disabled={sending || !conversationId}
              >
                {sending ? "Enviando…" : "Enviar"}
              </Button>
            </div>
          </Card>
          <div className="text-xs text-brand-subtext text-center">
            Las conversaciones se guardan asociadas a tu usuario demo. Más
            adelante se usarán para construir tu perfil de bienestar.
          </div>
        </div>
      </main>
    </div>
  );
}
