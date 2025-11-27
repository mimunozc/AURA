import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export default function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={
        "px-4 py-2 rounded-xl bg-brand-button-bg text-brand-button-text " +
        "hover:bg-brand-button-bg-hover transition font-medium " +
        className
      }
    >
      {children}
    </button>
  );
}
