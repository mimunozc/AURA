"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/identity";
import Header from "@/components/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";

type CheckInPoint = {
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

type DailySignal = {
  date: string;
  facets: Record<string, { value: string; confidence: number }>;
};

type DaySummary = {
  date: string;
  mood?: string;
  energy?: string;
  stress?: string;
  source: "checkin" | "signal" | "mixed" | "none";
};

type MoodKpis = {
  daysTracked: number;
  avgMoodScore: number;
  avgMoodLabel: string;
  currentStreak: number;
  trendLabel: string;
};

function formatDateLabel(d: string): string {
  const [y, m, day] = d.split("-");
  return `${day}/${m}`;
}

function moodScore(value: string | undefined): number | null {
  if (!value) return null;
  if (value === "low") return 1;
  if (value === "ok") return 2;
  if (value === "high") return 3;
  return null;
}

function moodLabelFromScore(score: number): string {
  if (score < 1.5) return "Más bien bajo";
  if (score < 2.2) return "Neutro / estable";
  return "Tendencia positiva";
}

function computeStreak(days: DaySummary[]): number {
  if (!days.length) return 0;
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (d.mood || d.energy || d.stress) streak++;
    else break;
  }
  return streak;
}

function computeTrend(days: DaySummary[]): string {
  const scored = days
    .map(d => moodScore(d.mood))
    .filter((x): x is number => x != null);
  if (scored.length < 4) return "Aún no hay suficientes datos";

  const mid = Math.floor(scored.length / 2);
  const first = scored.slice(0, mid);
  const last = scored.slice(mid);

  const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
  const avgLast = last.reduce((a, b) => a + b, 0) / last.length;
  const diff = avgLast - avgFirst;

  if (diff > 0.25) return "Tendencia en mejora";
  if (diff < -0.25) return "Tendencia a la baja";
  return "Tendencia estable";
}

function computeKpis(days: DaySummary[]): MoodKpis {
  const effectiveDays = days.filter(
    d => d.mood || d.energy || d.stress
  );
  const scores = effectiveDays
    .map(d => moodScore(d.mood))
    .filter((x): x is number => x != null);

  const avgMoodScore = scores.length
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  return {
    daysTracked: effectiveDays.length,
    avgMoodScore,
    avgMoodLabel: avgMoodScore ? moodLabelFromScore(avgMoodScore) : "Sin datos",
    currentStreak: computeStreak(days),
    trendLabel: computeTrend(days)
  };
}

export default function StatusPage() {
  const userId = useMemo(() => getUserId(), []);
  const [days, setDays] = useState<DaySummary[]>([]);
  const [kpis, setKpis] = useState<MoodKpis | null>(null);
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { dateFrom, dateTo, labelRange } = useMemo(() => {
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    const d = new Date(today);
    d.setDate(d.getDate() - 13);
    const from = d.toISOString().slice(0, 10);
    return {
      dateFrom: from,
      dateTo: to,
      labelRange: `Últimos 14 días (${from} a ${to})`
    };
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setInsight(null);
      try {
        const [checkins, signals] = await Promise.all([
          api.request<CheckInPoint[]>(
            `/checkin/range?userId=${encodeURIComponent(
              userId
            )}&dateFrom=${encodeURIComponent(
              dateFrom
            )}&dateTo=${encodeURIComponent(dateTo)}`
          ),
          api.request<DailySignal[]>(
            `/signals/daily?userId=${encodeURIComponent(
              userId
            )}&dateFrom=${encodeURIComponent(
              dateFrom
            )}&dateTo=${encodeURIComponent(dateTo)}`
          )
        ]);

        const map = new Map<string, DaySummary>();

        function ensureDay(date: string): DaySummary {
          if (!map.has(date)) {
            map.set(date, { date, source: "none" });
          }
          return map.get(date)!;
        }

        for (const ci of checkins) {
          const d = ensureDay(ci.date);
          d.mood = ci.mood;
          d.energy = ci.energy;
          d.stress = ci.stress;
          d.source = "checkin";
        }

        for (const s of signals) {
          const d = ensureDay(s.date);
          const mood = s.facets["mood"]?.value;
          const energy = s.facets["energy"]?.value;
          const stress = s.facets["stress"]?.value;
          if (mood && !d.mood) d.mood = mood;
          if (energy && !d.energy) d.energy = energy;
          if (stress && !d.stress) d.stress = stress;
          d.source =
            d.source === "checkin" ? "mixed" : d.source === "none" ? "signal" : d.source;
        }

        const allDays: DaySummary[] = [];
        const cursor = new Date(dateFrom);
        const end = new Date(dateTo);
        while (cursor <= end) {
          const iso = cursor.toISOString().slice(0, 10);
          allDays.push(map.get(iso) || { date: iso, source: "none" });
          cursor.setDate(cursor.getDate() + 1);
        }

        setDays(allDays);
        setKpis(computeKpis(allDays));
        if (allDays.some(d => d.mood || d.energy || d.stress)) {
          generateInsight(allDays, labelRange);
        }
      } catch {
        setError("No se pudo cargar el resumen emocional.");
      } finally {
        setLoading(false);
      }
    }

    async function generateInsight(daySummaries: DaySummary[], rangeLabel: string) {
      setInsightLoading(true);
      try {
        const compact = daySummaries.map(d => ({
          date: d.date,
          mood: d.mood || "none",
          energy: d.energy || "none",
          stress: d.stress || "none",
          source: d.source
        }));
        const userMsg =
          `Te paso el historial emocional de un usuario en el rango ${rangeLabel} en formato JSON.\n` +
          `Cada día tiene estado de ánimo (mood), energía y estrés con valores low|ok|high|none.\n` +
          `Responde en 2 o 3 frases breves en español, tono empático y profesional, ` +
          `explicando la tendencia general, un punto positivo y una recomendación práctica sencilla.\n\n` +
          JSON.stringify(compact);

        const res = await api.request<{ reply: string }>(
          "/chat",
          {
            method: "POST",
            body: JSON.stringify({
              system:
                "Eres AURA, un acompañante de bienestar. Resumes patrones emocionales de forma breve, clara y empática.",
              history: [],
              user: userMsg,
              followup: null
            })
          },
          "ai"
        );
        setInsight(res.reply);
      } catch {
        setInsight("No se pudo generar el insight de IA en este momento.");
      } finally {
        setInsightLoading(false);
      }
    }

    load();
  }, [userId, dateFrom, dateTo, labelRange]);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard emocional</h1>
            <p className="text-sm text-brand-subtext">
              Resumen de tu estado emocional reciente a partir de tus check-ins y señales
              detectadas en las conversaciones.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/checkin">
              <Button className="text-sm">Registrar Mood Check-in</Button>
            </Link>
            <Link
              href="/chat"
              className="px-4 py-3 rounded-xl border border-brand-border text-sm flex items-center"
            >
              Ir al chat
            </Link>
          </div>
        </div>

        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Línea de tiempo emocional</h2>
            <span className="text-xs text-brand-subtext">{labelRange}</span>
          </div>
          {loading && (
            <div className="text-sm text-brand-subtext">Cargando datos...</div>
          )}
          {error && <div className="text-sm text-red-500">{error}</div>}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <div className="flex gap-3 py-2">
                {days.map(d => {
                  const score = moodScore(d.mood);
                  let color = "bg-slate-500";
                  if (score === 1) color = "bg-rose-500";
                  if (score === 2) color = "bg-amber-400";
                  if (score === 3) color = "bg-emerald-500";
                  const hasData = d.mood || d.energy || d.stress;
                  return (
                    <div key={d.date} className="flex flex-col items-center min-w-[40px]">
                      <div
                        className={`w-6 h-6 rounded-full border border-brand-border flex items-center justify-center ${
                          hasData ? color : "bg-transparent"
                        }`}
                        title={`
${d.date}
Ánimo: ${d.mood || "-"}
Energía: ${d.energy || "-"}
Estrés: ${d.stress || "-"}
Fuente: ${d.source}
                        `}
                      />
                      <span className="mt-1 text-[11px] text-brand-subtext">
                        {formatDateLabel(d.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-xs text-brand-subtext mb-1">
              Días con registro
            </div>
            <div className="text-2xl font-semibold">
              {kpis?.daysTracked ?? "-"}
            </div>
            <div className="mt-2 text-xs text-brand-subtext">
              Considerando check-ins y señales de conversación.
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-brand-subtext mb-1">
              Ánimo promedio
            </div>
            <div className="text-2xl font-semibold">
              {kpis ? kpis.avgMoodLabel : "-"}
            </div>
            <div className="mt-2 text-xs text-brand-subtext">
              Escala aproximada basada en low, ok y high.
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-brand-subtext mb-1">
              Racha actual de registro
            </div>
            <div className="text-2xl font-semibold">
              {kpis?.currentStreak ?? "-"} días
            </div>
            <div className="mt-2 text-xs text-brand-subtext">
              Días seguidos con algún dato emocional.
            </div>
          </Card>
        </div>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Insight de IA</h2>
            {insightLoading && (
              <span className="text-xs text-brand-subtext">
                Analizando tus últimos días...
              </span>
            )}
          </div>
          {insight && (
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {insight}
            </p>
          )}
          {!insight && !insightLoading && (
            <p className="text-sm text-brand-subtext">
              Aún no hay suficientes datos para generar un insight. Empieza
              registrando tu estado en el Mood Check-in o conversando con Aura.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
