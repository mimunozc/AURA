"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/identity";

type StepDto = {
  id: string;
  order: number;
  title: string;
  kind: string;
  payload: string;
  estMinutes: number;
  xpReward: number;
  status: string;
};

type RecommendationResp = {
  trackId: string | null;
  name?: string;
  description?: string;
  reason?: string;
};

export default function TrackPage() {
  const params = useParams<{ trackId: string }>();
  const trackId = params.trackId;
  const userId = useMemo(() => getUserId(), []);
  const [steps, setSteps] = useState<StepDto[]>([]);
  const [trackName, setTrackName] = useState<string | null>(null);
  const [trackDescription, setTrackDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setInfo(null);
      try {
        const rec = await api.request<RecommendationResp>(
          `/adaptive/recommendation?userId=${encodeURIComponent(userId)}`
        );
        if (rec.trackId && rec.trackId === trackId) {
          setTrackName(rec.name ?? null);
          setTrackDescription(rec.description ?? null);
        }

        const data = await api.request<StepDto[]>(
          `/adaptive/tracks/${encodeURIComponent(
            trackId
          )}/steps?userId=${encodeURIComponent(userId)}`
        );
        setSteps(data);
        if (!trackName && rec.trackId !== trackId) {
          setTrackName("Guía adaptativa");
        }
      } catch {
        setError("No se pudieron cargar los pasos de esta guía.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [trackId, userId]);

  async function handleComplete(stepId: string) {
    setSaving(stepId);
    setError(null);
    setInfo(null);
    try {
      const res = await api.request<{
        newLevel: number;
        xpTotal: number;
        unlockedAchievements: string[];
        trackCompleted: boolean;
      }>("/adaptive/steps/complete", {
        method: "POST",
        body: JSON.stringify({
          userId,
          stepId
        })
      });

      setSteps(prev =>
        prev.map(s =>
          s.id === stepId ? { ...s, status: "done" } : s
        )
      );

      let msg = `Paso completado. Nivel actual: ${res.newLevel}. XP total: ${res.xpTotal}.`;
      if (res.unlockedAchievements.length) {
        msg += ` Nuevos logros: ${res.unlockedAchievements.join(", ")}.`;
      }
      if (res.trackCompleted) {
        msg += " Has completado esta guía adaptativa.";
      }
      setInfo(msg);
    } catch {
      setError("Ocurrió un error al completar el paso.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">
              {trackName ?? "Guía adaptativa"}
            </h1>
            {trackDescription && (
              <p className="text-sm text-brand-subtext">{trackDescription}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/guide">
                <Button type="button">
                Volver a resumen
                </Button>
            </Link>
            <Link href="/status">
                <Button type="button">
                Ver dashboard
                </Button>
            </Link>
            </div>
        </div>

        {loading && (
          <div className="text-sm text-brand-subtext">
            Cargando pasos de la guía...
          </div>
        )}
        {error && <div className="text-sm text-red-500">{error}</div>}
        {info && <div className="text-sm text-emerald-500">{info}</div>}

        {!loading && !error && (
          <Card className="p-4 space-y-3">
            {steps.length === 0 ? (
              <p className="text-sm text-brand-subtext">
                Esta guía aún no tiene pasos configurados.
              </p>
            ) : (
              <div className="space-y-3">
                {steps.map(step => (
                  <div
                    key={step.id}
                    className="border border-brand-border rounded-xl px-3 py-2 bg-brand-card flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">
                          Paso {step.order}: {step.title}
                        </div>
                        <div className="text-[11px] text-brand-subtext">
                          Tipo: {step.kind} · {step.estMinutes} min aprox. · {step.xpReward} XP
                        </div>
                      </div>
                      <div className="text-xs">
                        {step.status === "done" ? (
                          <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/40">
                            Completado
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-slate-500/10 text-slate-200 border border-slate-500/40">
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                    {step.payload && (
                      <p className="text-xs text-brand-subtext">
                        {step.payload}
                      </p>
                    )}
                    <div className="flex justify-end gap-2">
                    <Link
                        href={`/chat?stepId=${encodeURIComponent(
                        step.id
                        )}&stepTitle=${encodeURIComponent(step.title)}`}
                        className="text-xs self-center underline text-brand-subtext"
                    >
                        Trabajar este paso con AURA
                    </Link>
                    <Button
                        type="button"
                        disabled={step.status === "done" || saving === step.id}
                        onClick={() => handleComplete(step.id)}
                    >
                        {step.status === "done"
                        ? "Completado"
                        : saving === step.id
                        ? "Guardando..."
                        : "Marcar como completado"}
                    </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
