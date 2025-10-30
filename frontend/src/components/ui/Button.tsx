"use client";
import { ButtonHTMLAttributes } from "react";

export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={`px-4 py-3 rounded-xl bg-brand-primary text-white hover:bg-brand-primaryHover disabled:opacity-50 disabled:cursor-not-allowed shadow-soft ${className}`}
    />
  );
}
