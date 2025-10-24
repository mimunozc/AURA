import React from "react";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 my-2">
      <span className="animate-pulse">AURA está escribiendo…</span>
    </div>
  );
}
