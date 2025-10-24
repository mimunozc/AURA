"use client";

import { useEffect, useState } from "react";
import { apiBase } from "@/lib/api";

type MoodItem = {
  id: string;
  mood: string;
  notes: string;
  createdAt: string;
  conversationId?: string | null;
};

export default function MoodPage() {
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<MoodItem[]>([]);
  const [cid, setCid] = useState<string>(""); // conversación actual (opcional)
  const token =
    typeof window !== "undefined" ? localStorage.getItem("aura_token") : null;

  const hdr = () => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const ensureConversation = async () => {
    // intenta obtener/crear una conversación para asociar los registros
    try {
      const r = await fetch(`${apiBase}/chat/start`, {
        method: "POST",
        headers: hdr(),
      });
      if (!r.ok) {
        if (r.status === 401) {
          window.location.href = "/login";
          return;
        }
        return;
      }
      const d = await r.json();
      setCid(d.conversationId);
    } catch {
      /* no-op */
    }
  };

  const load = async () => {
    const url = cid
      ? `${apiBase}/mood?conversationId=${cid}`
      : `${apiBase}/mood`;
    const r = await fetch(url, { headers: hdr(), cache: "no-store" });
    if (!r.ok) {
      if (r.status === 401) {
        window.location.href = "/login";
      }
      return;
    }
    const d: MoodItem[] = await r.json();
    setItems(d);
  };

  const save = async () => {
    const payload = {
      mood: mood.trim(),
      notes: notes.trim(),
      conversationId: cid || null,
    };
    if (!payload.mood && !payload.notes) return;

    const r = await fetch(`${apiBase}/mood`, {
      method: "POST",
      headers: hdr(),
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      alert("No se pudo guardar el registro.");
      return;
    }
    setMood("");
    setNotes("");
    await load();
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }
    // Inicia/asegura conversación y luego carga registros
    ensureConversation().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Registro de ánimo</h1>

      <div className="grid gap-2">
        <input
          className="border p-2 rounded-xl"
          placeholder='Ánimo (ej: "7" o "tranquilo")'
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
        />
        <textarea
          className="border p-2 rounded-xl"
          placeholder="Notas (¿qué influyó en tu ánimo?)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          onClick={save}
          className="px-4 py-2 rounded-xl bg-black text-white"
        >
          Guardar
        </button>
      </div>

      <div className="space-y-2">
        {items.map((x) => (
          <div key={x.id} className="border rounded-xl p-3">
            <div className="text-xs text-gray-600">
              {new Date(x.createdAt).toLocaleString()}
            </div>
            <div className="font-medium">Ánimo: {x.mood || "—"}</div>
            <div className="text-sm">{x.notes}</div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-gray-600">Sin registros aún.</div>
        )}
      </div>
    </div>
  );
}
