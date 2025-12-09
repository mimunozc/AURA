"use client";
import { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({ className = "", ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        {...props}
        className={
          "w-full appearance-none px-3 py-2 rounded-xl border border-brand-border bg-white " +
          "text-sm text-brand-text pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary " +
          className
        }
      />
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-brand-subtext">
        ▼
      </div>
    </div>
  );
}
