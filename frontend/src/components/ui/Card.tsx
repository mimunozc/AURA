import { ReactNode } from "react";
export default function Card({ children, className="" }:{children:ReactNode; className?:string}) {
  return <div className={`bg-brand-card border border-brand-border rounded-2xl shadow-soft ${className}`}>{children}</div>;
}
