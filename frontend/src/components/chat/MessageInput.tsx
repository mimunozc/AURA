import React, { useState } from "react";

type Props = {
  disabled?: boolean;
  onSend: (text: string) => void;
  placeholder?: string;
};

export default function MessageInput({ disabled, onSend, placeholder }: Props) {
  const [text, setText] = useState("");

  function submit() {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  }

  return (
    <div className="w-full flex items-center gap-2">
      <input
        className="flex-1 border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder || "Escribe aquí…"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        disabled={disabled}
      />
      <button
        className="rounded-xl px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        onClick={submit}
        disabled={disabled}
      >
        Enviar
      </button>
    </div>
  );
}
