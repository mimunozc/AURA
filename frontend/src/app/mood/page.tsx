"use client";
import { useEffect, useState } from "react";
import { apiBase } from "@/lib/api";
import Link from "next/link";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";


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
  const [cid, setCid] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("aura_token") : null;

  const hdr = () => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const ensureConversation = async () => {
    try {
      const r = await fetch(`${apiBase}/chat/start`, { method: "POST", headers: hdr() });
      if (r.ok) {
        const d = await r.json();
        setCid(d.conversationId);
      }
    } catch {}
  };

  const load = async () => {
    const url = cid ? `${apiBase}/mood?conversationId=${cid}` : `${apiBase}/mood`;
    const r = await fetch(url, { headers: hdr(), cache: "no-store" });
    if (r.ok) {
      const d: MoodItem[] = await r.json();
      setItems(d);
    }
  };

  const save = async () => {
    if (!mood && !notes) return;
    setSaving(true);
    const payload = { mood: mood.trim(), notes: notes.trim(), conversationId: cid || null };
    const r = await fetch(`${apiBase}/mood`, { method: "POST", headers: hdr(), body: JSON.stringify(payload) });
    if (r.ok) {
      setMood("");
      setNotes("");
      await load();
    } else alert("No se pudo guardar el registro.");
    setSaving(false);
  };

  useEffect(() => { ensureConversation().then(load); }, []);

return (
  <div className="min-h-dvh flex flex-col">
    <Header user="Matías" />
    <div className="flex-1 px-4 py-6">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold text-center">Registro de ánimo</h1>
        <Card className="p-4 space-y-3">
          <Input placeholder='Ánimo (ej: "7" o "tranquilo")' value={mood} onChange={(e)=>setMood(e.target.value)} />
          <Textarea placeholder="Notas (¿qué influyó en tu ánimo?)" value={notes} onChange={(e)=>setNotes(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={save}>Guardar</Button>
            <Link href="/chat" className="px-4 py-3 rounded-xl border border-brand-border">Volver al chat</Link>
          </div>
        </Card>
        <div className="space-y-2">
          {items.map((x) => (
            <Card key={x.id} className="p-3">
              <div className="text-xs text-brand-subtext">{new Date(x.createdAt).toLocaleString()}</div>
              <div className="font-medium">Ánimo: {x.mood || "—"}</div>
              <div className="text-sm text-brand-subtext">{x.notes}</div>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="text-sm text-brand-subtext text-center">Sin registros aún.</div>
          )}
        </div>
      </div>
    </div>
  </div>
);


}
