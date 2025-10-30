"use client";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";


const USER_ID = "demo-user";

export default function CheckinPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [mood, setMood] = useState("ok");
  const [sleep, setSleep] = useState("ok");
  const [energy, setEnergy] = useState("ok");
  const [stress, setStress] = useState("med");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    await api.checkin.submit({ userId: USER_ID, date, mood, sleep, energy, stress, notes });
    alert("Check-in guardado");
    setSaving(false);
  }

return (
  <div className="min-h-dvh flex flex-col">
    <Header user="Matías" />
    <div className="flex-1 px-4 py-6">
      <div className="max-w-xl mx-auto space-y-4">
        <h2 className="text-2xl font-semibold text-center">Check-in diario</h2>
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm text-brand-subtext">Fecha
              <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
            </label>
            <label className="text-sm text-brand-subtext">Ánimo
              <Select value={mood} onChange={e=>setMood(e.target.value)}>
                <option value="low">low</option><option value="ok">ok</option><option value="high">high</option>
              </Select>
            </label>
            <label className="text-sm text-brand-subtext">Sueño
              <Select value={sleep} onChange={e=>setSleep(e.target.value)}>
                <option value="poor">poor</option><option value="ok">ok</option><option value="good">good</option>
              </Select>
            </label>
            <label className="text-sm text-brand-subtext">Energía
              <Select value={energy} onChange={e=>setEnergy(e.target.value)}>
                <option value="low">low</option><option value="ok">ok</option><option value="high">high</option>
              </Select>
            </label>
            <label className="text-sm text-brand-subtext">Estrés
              <Select value={stress} onChange={e=>setStress(e.target.value)}>
                <option value="low">low</option><option value="med">med</option><option value="high">high</option>
              </Select>
            </label>
          </div>
          <label className="text-sm text-brand-subtext">Notas
            <Textarea value={notes} onChange={e=>setNotes(e.target.value)} />
          </label>
          <div className="flex gap-2">
            <Button onClick={submit}>Guardar</Button>
            <Link href="/chat" className="px-4 py-3 rounded-xl border border-brand-border">Volver al chat</Link>
          </div>
        </Card>
      </div>
    </div>
  </div>
);

}
