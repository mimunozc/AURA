"use client";
import Link from "next/link";
import { useState } from "react";

export default function Header({ user="Usuario" }:{user?:string}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-brand-border bg-white sticky top-0 z-10">
      <div className="font-semibold">{user}</div>
      <div className="relative">
        <button onClick={()=>setOpen(v=>!v)} className="px-3 py-2 rounded-xl border border-brand-border">Menú</button>
        {open && (
          <div className="absolute right-0 mt-2 w-44 bg-white border border-brand-border rounded-xl shadow-soft">
            <Link className="block px-3 py-2 hover:bg-brand-bg rounded-t-xl" href="/chat">Chat</Link>
            <Link className="block px-3 py-2 hover:bg-brand-bg" href="/checkin">Check-in</Link>
            <Link className="block px-3 py-2 hover:bg-brand-bg" href="/journal">Journal</Link>
            <Link className="block px-3 py-2 hover:bg-brand-bg rounded-b-xl" href="/mood">Mood</Link>
          </div>
        )}
      </div>
    </div>
  );
}
