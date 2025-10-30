"use client";
import { InputHTMLAttributes } from "react";
export default function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className="", ...rest } = props;
  return <input {...rest} className={`w-full px-3 py-3 border rounded-xl bg-white ${className}`} />;
}
