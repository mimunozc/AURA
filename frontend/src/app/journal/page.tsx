"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const USER_ID = "demo-user";

export default function JournalPage() {
  const [text, setText] = useState("");
  const [items, setItems] = useState<{id:string;text:string;ts:string}[]>([]);
  async function load(){ setItems(await api.journal.list(USER_ID)); }
  useEffect(()=>{ load(); },[]);
  async function save(){
    if(!text.trim()) return;
    await api.journal.add(USER_ID, text.trim());
    setText("");
    await load();
  }
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Journal</h2>
      <textarea className="w-full border rounded p-3 min-h-28" value={text} onChange={e=>setText(e.target.value)} />
      <button onClick={save} className="px-4 py-2 border rounded">Guardar</button>
      <div className="space-y-3">
        {items.map(i=>(
          <div key={i.id} className="border rounded p-3">
            <div className="text-xs text-gray-500">{new Date(i.ts).toLocaleString()}</div>
            <div>{i.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
