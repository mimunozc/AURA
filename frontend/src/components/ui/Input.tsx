import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={
        "w-full px-3 py-2 rounded-xl border border-brand-border text-brand-text bg-brand-bg-soft focus:outline-none focus:ring-2 focus:ring-brand-primary " +
        className
      }
    />
  );
}
