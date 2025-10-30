"use client";
import { SelectHTMLAttributes } from "react";
export default function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className="", ...rest } = props;
  return <select {...rest} className={`w-full px-3 py-3 border rounded-xl bg-white ${className}`} />;
}
