"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/identity";

type ProfileDto = {
  level: number;
  xpTotal: number;
  nextLevelXp: number;
};

type CurrentTrackDto = {
  trackId: string;
  name: string;
  currentStepOrder: number;
  stepsTotal: number;
  completedSteps: number;
} | null;

type AchievementDto = {
  code: string;
  name: string;
  description: string;
  unlockedAt: string;
};

type OverviewDto = {
  profile: ProfileDto;
  currentTrack: CurrentTrackDto;
  recentAchievements: AchievementDto[];
};

export default function GuidePage() {
  const userId = useMemo(() => getUserId(), []);
  const [data, setData] = useState<OverviewDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.request<OverviewDto>(
          `/adaptive/overview?userId=${encodeURIComponent(userId)}`
        );
        setData(res);
      } catch {
        setError("No se pudo cargar tu guía adaptativa.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const profile = data?.profile;
  const track = data?.currentTrack;
  const achievements = data?.recentAchievements ?? [];

  const xpProgress =
    profile && profile.nextLevelXp > 0
      ? Math.min(100, Math.round((profile.xpTotal / profile.nextLevelXp) * 100))
      : 0;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Guía adaptativa</h1>
            <p className="text-sm text-brand-subtext">
              Un pequeño programa de ejercicios y reflexiones diseñado según tus patrones emocionales.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/status">
              <Button className="text-sm">Ver dashboard emocional</Button>
            </Link>
            <Link href="/checkin">
              <Button className="text-sm" type="button">
                Hacer Mood Check-in
              </Button>
            </Link>
          </div>
        </div>

        {loading && (
          <div className="text-sm text-brand-subtext">Cargando tu progreso...</div>
        )}
        {error && <div className="text-sm text-red-500">{error}</div>}

        {data && (
          <>
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-brand-subtext">Nivel actual</div>
                  <div className="text-3xl font-semibold">
                    {profile?.level ?? 1}
                  </div>
                </div>
                <div className="flex-1 ml-6">
                  <div className="flex justify-between text-xs text-brand-subtext">
                    <span>Progreso al siguiente nivel</span>
                    <span>
                      {profile?.xpTotal ?? 0}/{profile?.nextLevelXp ?? 100} XP
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full bg-brand-card border border-brand-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Ruta actual</h2>
              </div>
              {track ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{track.name}</div>
                      <div className="text-xs text-brand-subtext">
                        Paso {track.currentStepOrder} de {track.stepsTotal}
                      </div>
                    </div>
                    <div className="text-xs text-brand-subtext">
                      Pasos completados: {track.completedSteps}/{track.stepsTotal}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {track && (
                        <Link href={`/guide/${encodeURIComponent(track.trackId)}`}>
                        <Button type="button">
                            Continuar ruta
                        </Button>
                        </Link>
                    )}
                    <span className="text-xs text-brand-subtext self-center">
                        Avanza paso a paso; algunos ejercicios se integrarán con el chat en próximas versiones.
                    </span>
                    </div>
                </>
              ) : (
                <p className="text-sm text-brand-subtext">
                  Aún no tienes una ruta asignada. En próximas versiones AURA recomendará una
                  guía adaptativa basada en tu dashboard emocional.
                </p>
              )}
            </Card>

            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Logros recientes</h2>
              </div>
              {achievements.length === 0 ? (
                <p className="text-sm text-brand-subtext">
                  Todavía no tienes logros desbloqueados. Empieza registrando tu estado y siguiendo las guías.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {achievements.map(a => (
                    <div
                      key={a.code}
                      className="border border-brand-border rounded-xl px-3 py-2 bg-brand-card"
                    >
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="text-xs text-brand-subtext">{a.description}</div>
                      <div className="text-[11px] text-brand-subtext mt-1">
                        Desbloqueado: {a.unlockedAt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
