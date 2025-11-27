"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/identity";
import Link from "next/link";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";

const USER_ID = typeof window === "undefined" ? "demo-user" : getUserId();

type CheckInDto = {
  id: string;
  userId: string;
  date: string;
  mood: string;
  sleep: string;
  energy: string;
  stress: string;
  notes: string | null;
  createdAt: string;
};

const moodOptions = [
  { value: "low", label: "Bajo" },
  { value: "ok", label: "Neutro" },
  { value: "high", label: "Alto" }
];

const sleepOptions = [
  { value: "poor", label: "Malo" },
  { value: "ok", label: "Regular" },
  { value: "good", label: "Bueno" }
];

const energyOptions = [
  { value: "low", label: "Baja" },
  { value: "ok", label: "Media" },
  { value: "high", label: "Alta" }
];

const stressOptions = [
  { value: "low", label: "Bajo" },
  { value: "med", label: "Medio" },
  { value: "high", label: "Alto" }
];

export default function CheckinPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [mood, setMood] = useState("ok");
  const [sleep, setSleep] = useState("ok");
  const [energy, setEnergy] = useState("ok");
  const [stress, setStress] = useState("med");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function loadExisting(targetDate: string) {
    setLoading(true);
    setStatus(null);
    try {
      const existing = await api.request<CheckInDto | null>(
        `/checkin/by-date?userId=${encodeURIComponent(
          USER_ID
        )}&date=${encodeURIComponent(targetDate)}`
      );
      if (existing) {
        setMood(existing.mood);
        setSleep(existing.sleep);
        setEnergy(existing.energy);
        setStress(existing.stress);
        setNotes(existing.notes ?? "");
      } else {
        setMood("ok");
        setSleep("ok");
        setEnergy("ok");
        setStress("med");
        setNotes("");
      }
    } catch {
      setStatus("No se pudo cargar el registro de ese día.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExisting(today);
  }, [today]);

  async function handleSubmit() {
    setLoading(true);
    setStatus(null);
    try {
      await api.request<{ id: string }>("/checkin/submit", {
        method: "POST",
        body: JSON.stringify({
          userId: USER_ID,
          date,
          mood,
          sleep,
          energy,
          stress,
          notes: notes.trim() || null
        })
      });
      setStatus("Check-in guardado.");
    } catch {
      setStatus("Ocurrió un error al guardar.");
    } finally {
      setLoading(false);
    }
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const d = e.target.value;
    setDate(d);
    loadExisting(d);
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-2">Mood Check-in</h1>
        <p className="text-sm text-brand-subtext mb-4">
          Registra en pocos segundos cómo estás hoy. Esto alimenta tu línea de
          tiempo emocional y las recomendaciones de Aura.
        </p>
        <Card className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <label className="text-sm">
              Fecha
              <Input
                type="date"
                value={date}
                onChange={handleDateChange}
                className="mt-1"
              />
            </label>
            <div className="text-xs text-brand-subtext">
              Usuario actual: <span className="font-medium">{USER_ID}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-brand-subtext">
              Estado de ánimo
              <Select
                value={mood}
                onChange={e => setMood(e.target.value)}
              >
                {moodOptions.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm text-brand-subtext">
              Sueño
              <Select
                value={sleep}
                onChange={e => setSleep(e.target.value)}
              >
                {sleepOptions.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm text-brand-subtext">
              Energía
              <Select
                value={energy}
                onChange={e => setEnergy(e.target.value)}
              >
                {energyOptions.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm text-brand-subtext">
              Estrés
              <Select
                value={stress}
                onChange={e => setStress(e.target.value)}
              >
                {stressOptions.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <label className="text-sm text-brand-subtext">
            Notas
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Opcional: algo que quieras recordar de hoy"
            />
          </label>
          {status && (
            <div className="text-sm text-brand-subtext">{status}</div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
            <Link
              href="/chat"
              className="px-4 py-3 rounded-xl border border-brand-border text-sm"
            >
              Volver al chat
            </Link>
            <Link
              href="/status"
              className="px-4 py-3 rounded-xl border border-brand-border text-sm"
            >
              Ver resumen emocional
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
