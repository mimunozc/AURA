"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Textarea from "@/components/ui/Textarea";


const USER_ID = "demo-user";

export default function JournalPage() {
  const [text, setText] = useState("");
  const [items, setItems] = useState<{ id: string; text: string; ts: string }[]>([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    setItems(await api.journal.list(USER_ID));
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    await api.journal.add(USER_ID, text.trim());
    setText("");
    await load();
    setSaving(false);
  }

return (
  <div className="min-h-dvh flex flex-col">
    <Header user="Matías" />
    <div className="flex-1 px-4 py-6">
      <div className="max-w-xl mx-auto space-y-4">
        <h2 className="text-2xl font-semibold text-center">Journal</h2>
        <Card className="p-4 space-y-3">
          <Textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Escribe aquí lo que sientes..." />
          <div className="flex gap-2">
            <Button onClick={save}>Guardar</Button>
            <Link href="/chat" className="px-4 py-3 rounded-xl border border-brand-border">Volver al chat</Link>
          </div>
        </Card>
        <div className="space-y-3">
          {items.map(i=>(
            <Card key={i.id} className="p-4">
              <div className="text-xs text-brand-subtext mb-1">{new Date(i.ts).toLocaleString()}</div>
              <div>{i.text}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </div>
);

}
