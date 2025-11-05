"use client";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("Demo.1234");
  const [loading, setLoading] = useState(false);
  const r = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("aura_dev_email");
    if (saved) setEmail(saved);
    else setEmail(`demo+${Date.now()}@aura.cl`);
  }, []);

  async function doLogin() {
  try {
    setLoading(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email, password: pwd })
    });

    if (!res.ok) { alert("Credenciales inválidas"); return; }

    const j = await res.json();
    localStorage.setItem("aura_token", j.token);
    localStorage.setItem("aura_dev_email", email);
    r.replace("/chat");
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm border rounded-2xl p-5 space-y-3">
        <h1 className="text-xl font-semibold text-center">Iniciar sesión</h1>
        <input
          className="w-full rounded-xl border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email"
        />
        <input
          className="w-full rounded-xl border border-brand-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          value={pwd}
          onChange={e => setPwd(e.target.value)}
          type="password"
          placeholder="contraseña"
        />
        <button
          onClick={doLogin}
          disabled={loading}
          className="w-full rounded bg-blue-600 text-white py-2 disabled:opacity-50"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
        <a href="/chat" className="block text-center underline text-sm">Volver al chat</a>
      </div>
    </div>
  );
}
