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
    setLoading(true);
    try {
      const login = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pwd })
      });

      if (login.status === 401) {
        const reg = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: pwd })
        });
        if (!reg.ok && reg.status !== 409) throw new Error("register failed");
        const again = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: pwd })
        });
        if (!again.ok) throw new Error("login failed");
        const j = await again.json();
        localStorage.setItem("aura_token", j.token);
        localStorage.setItem("aura_dev_email", email);
        r.replace("/chat");
        return;
      }

      if (!login.ok) throw new Error("login failed");
      const j = await login.json();
      localStorage.setItem("aura_token", j.token);
      localStorage.setItem("aura_dev_email", email);
      r.replace("/chat");
    } catch {
      alert("No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm border rounded-2xl p-5 space-y-3">
        <h1 className="text-xl font-semibold text-center">Iniciar sesión</h1>
        <input
          className="w-full border rounded px-3 py-2"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          placeholder="email"
        />
        <input
          className="w-full border rounded px-3 py-2"
          value={pwd}
          onChange={e=>setPwd(e.target.value)}
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
