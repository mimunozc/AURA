import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  text: string;
  ts?: string;
};

type Props = {
  messages: ChatMessage[];
};

export default function ChatWindow({ messages }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // autoscroll al último mensaje
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto px-4 py-3 bg-white"
      style={{ scrollbarWidth: "thin" }}
    >
      {messages.map((m, i) => (
        <MessageBubble key={`${i}-${m.ts || ""}`} role={m.role} text={m.text} />
      ))}
    </div>
  );
}
