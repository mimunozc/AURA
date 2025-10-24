"use client";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";

const USER_ID = "demo-user";

export default function CheckinPage(){
  const today = useMemo(()=>new Date().toISOString().slice(0,10),[]);
  const [date, setDate] = useState(today);
  const [mood, setMood] = useState("ok");
  const [sleep, setSleep] = useState("ok");
  const [energy, setEnergy] = useState("ok");
  const [stress, setStress] = useState("med");
  const [notes, setNotes] = useState("");

  async function submit(){
    await api.checkin.submit({ userId: USER_ID, date, mood, sleep, energy, stress, notes });
    alert("Check-in guardado");
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Check-in diario</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label>Fecha
          <input type="date" className="block border rounded px-2 py-1" value={date} onChange={e=>setDate(e.target.value)} />
        </label>
        <label>Ánimo
          <select className="block border rounded px-2 py-1" value={mood} onChange={e=>setMood(e.target.value)}>
            <option value="low">low</option><option value="ok">ok</option><option value="high">high</option>
          </select>
        </label>
        <label>Sueño
          <select className="block border rounded px-2 py-1" value={sleep} onChange={e=>setSleep(e.target.value)}>
            <option value="poor">poor</option><option value="ok">ok</option><option value="good">good</option>
          </select>
        </label>
        <label>Energía
          <select className="block border rounded px-2 py-1" value={energy} onChange={e=>setEnergy(e.target.value)}>
            <option value="low">low</option><option value="ok">ok</option><option value="high">high</option>
          </select>
        </label>
        <label>Estrés
          <select className="block border rounded px-2 py-1" value={stress} onChange={e=>setStress(e.target.value)}>
            <option value="low">low</option><option value="med">med</option><option value="high">high</option>
          </select>
        </label>
      </div>
      <label>Notas
        <textarea className="w-full border rounded p-2 min-h-24" value={notes} onChange={e=>setNotes(e.target.value)} />
      </label>
      <button onClick={submit} className="px-4 py-2 border rounded">Guardar</button>
    </div>
  );
}
