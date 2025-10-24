"use client";
import { useState } from "react";
import { API_URL, AI_URL } from "@/lib/api";

export default function Home() {
  const [api, setApi] = useState("-");
  const [ai, setAi] = useState("-");
  const [auth, setAuth] = useState("-");

  async function check() {
    const apiRes = await fetch(`${API_URL}/health`).then(r => r.json());
    const aiRes  = await fetch(`${AI_URL}/health`).then(r => r.json());
    setApi(apiRes.service || JSON.stringify(apiRes));
    setAi(aiRes.status || apiRes.service || JSON.stringify(aiRes));

    // Obtener token dev y guardarlo
    try {
      const t = await fetch(`${API_URL}/auth/dev`).then(r => r.json());
      if (t?.token) {
        localStorage.setItem("aura_token", t.token);
        setAuth("token ok");
      } else {
        setAuth("sin token");
      }
    } catch {
      setAuth("error token");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">AURA - Companion App</h1>
      <button onClick={check} className="px-3 py-1 bg-blue-600 text-white rounded">Probar servicios</button>
      <div className="mt-3">API: {api} | AI: {ai} | Auth: {auth}</div>
    </div>
  );
}
