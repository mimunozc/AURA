"use client";
import { TextareaHTMLAttributes } from "react";
export default function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className="", ...rest } = props;
  return <textarea {...rest} className={`w-full px-3 py-3 border rounded-xl bg-white min-h-28 ${className}`} />;
}
