"use client";
import { InputHTMLAttributes } from "react";

export default function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;

  return (
    <input
      {...rest}
      className={`w-full px-3 py-3 border border-slate-700 rounded-xl bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
}
