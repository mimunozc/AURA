"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Textarea from "@/components/ui/Textarea";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/identity";

type JournalItem = {
  id: string;
  text: string;
  ts: string;
};

export default function JournalPage() {
  const userId = useMemo(() => getUserId(), []);
  const [text, setText] = useState("");
  const [items, setItems] = useState<JournalItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.request<JournalItem[]>(
        `/journal/list?userId=${encodeURIComponent(userId)}`
      );
      setItems(res);
    } catch {
      setError("No se pudo cargar tu journal.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [userId]);

  async function save() {
    const value = text.trim();
    if (!value || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.request<{ id: string; ts: string }>(
        "/journal/add",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, text: value })
        }
      );
      setItems(prev => [{ id: res.id, text: value, ts: res.ts }, ...prev]);
      setText("");
    } catch {
      setError("No se pudo guardar tu entrada. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Journal</h1>
              <p className="text-sm text-brand-subtext">
                Un espacio para escribir lo que sientes y piensas. AURA utiliza
                estas entradas para entender mejor tu contexto.
              </p>
            </div>
            <Link href="/status">
              <Button type="button" className="text-sm">
                Ver dashboard
              </Button>
            </Link>
          </div>

          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Nueva entrada</div>
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={5}
                placeholder="Hoy me sentí..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Link href="/chat">
                <Button type="button" className="text-sm">
                  Volver al chat
                </Button>
              </Link>
              <Button
                type="button"
                onClick={save}
                disabled={saving || !text.trim()}
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
            {error && (
              <div className="text-xs text-red-500 mt-1">
                {error}
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Entradas recientes</div>
            </div>
            {loading && (
              <div className="text-xs text-brand-subtext">
                Cargando tus entradas...
              </div>
            )}
            {!loading && items.length === 0 && (
              <div className="text-xs text-brand-subtext">
                Aún no has escrito en tu journal. Lo que escribas aquí también
                ayudará a tu dashboard emocional.
              </div>
            )}
            <div className="space-y-3">
              {items.map(i => (
                <Card key={i.id} className="p-4">
                  <div className="text-xs text-brand-subtext mb-1">
                    {new Date(i.ts).toLocaleString()}
                  </div>
                  <div className="text-sm whitespace-pre-line">
                    {i.text}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
