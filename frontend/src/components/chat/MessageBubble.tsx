import React from "react";

type Props = {
  role: "user" | "assistant" | "system";
  text: string;
};

export default function MessageBubble({ role, text }: Props) {
  const isUser = role === "user";
  const base =
    "max-w-[85%] rounded-2xl px-4 py-2 shadow-sm whitespace-pre-wrap break-words";
  const mine = "bg-blue-600 text-white ml-auto";
  const theirs = "bg-gray-100 text-gray-900 mr-auto";
  const sys = "bg-yellow-50 text-yellow-800 mr-auto";

  return (
    <div className={`flex my-1 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`${base} ${role === "system" ? sys : isUser ? mine : theirs}`}>
        {text}
      </div>
    </div>
  );
}
