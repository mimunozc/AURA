import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={
        "rounded-xl bg-brand-card border border-brand-border shadow-sm " +
        className
      }
    >
      {children}
    </div>
  );
}
