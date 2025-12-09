"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header({ user = "Usuario" }: { user?: string }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"user" | "specialist" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const r = localStorage.getItem("aura_role");
    if (r === "user" || r === "specialist") setRole(r);
  }, []);

  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-brand-border bg-white sticky top-0 z-10">
      <div className="font-semibold text-indigo-600 cursor-pointer">
        <Link href="/chat">AURA</Link>
      </div>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-1 rounded-full border border-brand-border text-sm bg-white hover:bg-brand-bg"
        >
          {user}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-brand-border bg-white shadow-xl text-sm">
            {role === "specialist" ? (
              <>
                <Link
                  className="block px-3 py-2 hover:bg-brand-bg"
                  href="/specialist"
                >
                  Panel especialista
                </Link>
              </>
            ) : (
              <>
                <Link
                  className="block px-3 py-2 hover:bg-brand-bg"
                  href="/chat"
                >
                  Chat
                </Link>
                <Link
                  className="block px-3 py-2 hover:bg-brand-bg"
                  href="/checkin"
                >
                  Check-in
                </Link>
                <Link
                  className="block px-3 py-2 hover:bg-brand-bg"
                  href="/journal"
                >
                  Journal
                </Link>
                <Link
                  className="block px-3 py-2 hover:bg-brand-bg"
                  href="/status"
                >
                  Dashboard
                </Link>
                <Link
                  className="block px-3 py-2 hover:bg-brand-bg"
                  href="/guide"
                >
                  Guía
                </Link>
                <Link
                  className="block px-3 py-2 hover:bg-brand-bg"
                  href="/specialists"
                >
                  Mis especialistas
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
