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
    else setEmail("user@aura.cl");
  }, []);

  async function doLogin() {
    if (!email || !pwd) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pwd })
      });

      if (!res.ok) {
        alert("Correo o contraseña incorrectos");
        return;
      }

      const j = await res.json();
      const role = email.toLowerCase().startsWith("specialist@") ? "specialist" : "user";
      localStorage.setItem("aura_role", role);
      localStorage.setItem("aura_token", j.token);
      localStorage.setItem("aura_dev_email", email);

      if (role === "specialist") {
        r.push("/specialist");
      } else {
        r.push("/chat");
      }
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-sm space-y-6 bg-slate-900/70 p-6 rounded-2xl border border-slate-800">
        <h1 className="text-xl font-semibold text-center">Inicio de sesión AURA</h1>
        <div className="space-y-3">
          <input
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo"
          />
          <input
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="contraseña"
          />
          <button
            onClick={doLogin}
            disabled={loading}
            className="w-full rounded bg-blue-600 text-white py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
          <a href="/chat" className="block text-center underline text-xs">
            Volver al chat
          </a>
        </div>
      </div>
    </div>
  );
}
