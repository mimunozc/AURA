"use client";
import { useState } from "react";
import { API_URL, AI_URL } from "@/lib/api";

export default function StatusPage() {
  const [api, setApi] = useState("-");
  const [ai, setAi] = useState("-");
  const [auth, setAuth] = useState("-");

  async function check() {
    const apiRes = await fetch(`${API_URL}/health`).then(r => r.json());
    const aiRes  = await fetch(`${AI_URL}/health`).then(r => r.json());
    setApi(apiRes.service || JSON.stringify(apiRes));
    setAi(aiRes.status || apiRes.service || JSON.stringify(aiRes));

    const PASS = "Demo.1234";
    const EMAIL_KEY = "aura_dev_email";
    let email = localStorage.getItem(EMAIL_KEY) || `demo+${Date.now()}@aura.cl`;

    const doLogin = async (em: string) =>
      fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, password: PASS }),
      });

    const doRegister = async (em: string) =>
      fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, password: PASS }),
      });

    try {
      let loginRes = await doLogin(email);
      if (loginRes.status === 401) {
        email = `demo+${Date.now()}@aura.cl`;
        const reg = await doRegister(email);
        if (!reg.ok && reg.status !== 409) console.warn("Register failed:", reg.status, await reg.text());
        loginRes = await doLogin(email);
      }
      if (!loginRes.ok) {
        console.error("Login failed:", loginRes.status, await loginRes.text());
        setAuth("error token");
        return;
      }
      const login = await loginRes.json();
      if (login?.token) {
        localStorage.setItem(EMAIL_KEY, email);
        localStorage.setItem("aura_token", login.token);
        setAuth("token ok");
      } else {
        setAuth("sin token");
      }
    } catch (e) {
      console.error(e);
      setAuth("error token");
    }
  }

  return (
    <div className="min-h-dvh flex flex-col p-4">
      <h1 className="text-2xl font-semibold mb-4">Estado de servicios</h1>
      <button onClick={check} className="px-3 py-2 bg-blue-600 text-white rounded">
        Probar servicios
      </button>
      <div className="mt-3">API: {api} | AI: {ai} | Auth: {auth}</div>
      <div className="mt-6">
        <a href="/chat" className="underline">Volver al chat</a>
      </div>
    </div>
  );
}
