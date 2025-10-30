"use client";

import { useState } from "react";
import ChatWindow, { ChatMessage } from "./ChatWindow";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hola 👋 soy AURA. ¿Cómo te sientes hoy?",
      ts: new Date().toISOString(),
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);

  async function handleSend(text: string) {
    // 1. agrego el mensaje del usuario
    const userMsg: ChatMessage = {
      role: "user",
      text,
      ts: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsTyping(true);

    const replyText =
      "Gracias por compartirlo 💙. Cuéntame un poco más: ¿esto te pasa hace mucho o es algo reciente?";

    // simular delay
    await new Promise((r) => setTimeout(r, 600));

    const assistantMsg: ChatMessage = {
      role: "assistant",
      text: replyText,
      ts: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsTyping(false);
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* ventana de mensajes */}
      <div className="flex-1">
        <ChatWindow messages={messages} />
        {isTyping && <TypingIndicator />}
      </div>

      {/* input */}
      <div className="border-t bg-white p-3">
        <MessageInput onSend={handleSend} placeholder="Escribe tu mensaje para AURA..." />
      </div>
    </div>
  );
}
