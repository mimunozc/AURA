'use client';

import { useState } from 'react';
import Link from 'next/link';

type RiskLevel = 'low' | 'medium' | 'high';

type DemoUser = {
  id: string;
  name: string;
  age: number;
  mainConcern: string;
  riskLevel: RiskLevel;
  lastCheckinDate: string;
  lastMessageAt: string;
  moodTrend: 'up' | 'down' | 'stable';
  tags: string[];
  city: string;
};

const DEMO_USERS: DemoUser[] = [
  {
    id: 'u1',
    name: 'Camila Reyes',
    age: 22,
    mainConcern: 'Ansiedad generalizada y dificultad para dormir',
    riskLevel: 'medium',
    lastCheckinDate: '2025-12-08',
    lastMessageAt: '2025-12-08 23:14',
    moodTrend: 'down',
    tags: ['sueño', 'ansiedad', 'universidad'],
    city: 'Santiago'
  },
  {
    id: 'u2',
    name: 'Matías López',
    age: 28,
    mainConcern: 'Estrés laboral y agotamiento emocional',
    riskLevel: 'high',
    lastCheckinDate: '2025-12-07',
    lastMessageAt: '2025-12-07 21:32',
    moodTrend: 'down',
    tags: ['burnout', 'trabajo', 'perfeccionismo'],
    city: 'Providencia'
  },
  {
    id: 'u3',
    name: 'Ignacia Fuentes',
    age: 19,
    mainConcern: 'Cambios de ánimo bruscos y desmotivación',
    riskLevel: 'medium',
    lastCheckinDate: '2025-12-06',
    lastMessageAt: '2025-12-06 18:10',
    moodTrend: 'stable',
    tags: ['estado de ánimo', 'familia'],
    city: 'Puente Alto'
  },
  {
    id: 'u4',
    name: 'Diego Herrera',
    age: 35,
    mainConcern: 'Preocupación constante y dificultad para desconectarse',
    riskLevel: 'low',
    lastCheckinDate: '2025-12-08',
    lastMessageAt: '2025-12-08 09:45',
    moodTrend: 'up',
    tags: ['estrés', 'hábito saludable'],
    city: 'Ñuñoa'
  },
  {
    id: 'u5',
    name: 'Valentina Ortiz',
    age: 26,
    mainConcern: 'Baja autoestima y comparación social',
    riskLevel: 'medium',
    lastCheckinDate: '2025-12-05',
    lastMessageAt: '2025-12-05 22:01',
    moodTrend: 'down',
    tags: ['autoestima', 'redes sociales'],
    city: 'Maipú'
  },
  {
    id: 'u6',
    name: 'Javier Pizarro',
    age: 42,
    mainConcern: 'Preocupaciones financieras y angustia ocasional',
    riskLevel: 'low',
    lastCheckinDate: '2025-12-04',
    lastMessageAt: '2025-12-04 19:27',
    moodTrend: 'stable',
    tags: ['finanzas', 'familia'],
    city: 'La Florida'
  }
];

function riskLabel(riskLevel: RiskLevel) {
  if (riskLevel === 'high') return 'Alto';
  if (riskLevel === 'medium') return 'Medio';
  return 'Bajo';
}

function riskBadgeClass(riskLevel: RiskLevel) {
  if (riskLevel === 'high') return 'bg-red-100 text-red-800 border-red-200';
  if (riskLevel === 'medium') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-emerald-100 text-emerald-800 border-emerald-200';
}

function moodTrendLabel(trend: DemoUser['moodTrend']) {
  if (trend === 'up') return 'Mejorando';
  if (trend === 'down') return 'Empeorando';
  return 'Estable';
}

export default function SpecialistUsersPage() {
  const [selectedId, setSelectedId] = useState(DEMO_USERS[0]?.id);
  const selected = DEMO_USERS.find(u => u.id === selectedId) ?? DEMO_USERS[0];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Panel de usuarios
            </h1>
            <p className="text-sm text-slate-500">
              Vista solo para especialistas. Aquí puedes revisar a las personas que acompañas en AURA.
            </p>
          </div>
          <div className="flex gap-2 text-xs text-slate-400">
            <span>Usuarios activos: {DEMO_USERS.length}</span>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-800">
                Lista de usuarios
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                Demo
              </span>
            </div>
            <div className="space-y-2">
              {DEMO_USERS.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedId(user.id)}
                  className={`flex w-full items-start justify-between rounded-xl border px-3 py-2 text-left transition ${
                    user.id === selected?.id
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {user.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {user.age} años
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {user.mainConcern}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {user.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={
                        'rounded-full border px-2 py-0.5 text-[10px] font-medium ' +
                        riskBadgeClass(user.riskLevel)
                      }
                    >
                      Riesgo {riskLabel(user.riskLevel)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Último check-in: {user.lastCheckinDate}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium text-slate-800">
                  Resumen de la persona
                </h2>
                <p className="text-xs text-slate-500">
                  Vista rápida basada en el uso de AURA, pensada para apoyar tu criterio clínico.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={
                    'rounded-full border px-2 py-0.5 text-[10px] font-medium ' +
                    riskBadgeClass(selected.riskLevel)
                  }
                >
                  Riesgo {riskLabel(selected.riskLevel)}
                </span>
                <span className="text-[10px] text-slate-400">
                  Tendencia: {moodTrendLabel(selected.moodTrend)}
                </span>
              </div>
            </div>

            <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {selected.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selected.age} años, {selected.city}
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <div>Último mensaje IA</div>
                  <div>{selected.lastMessageAt}</div>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Motivo principal: {selected.mainConcern}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-white px-2 py-1.5">
                  <div className="text-[11px] text-slate-400">
                    Actividad reciente
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    Alta
                  </div>
                </div>
                <div className="rounded-lg bg-white px-2 py-1.5">
                  <div className="text-[11px] text-slate-400">
                    Check-ins últimos 7 días
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    4
                  </div>
                </div>
                <div className="rounded-lg bg-white px-2 py-1.5">
                  <div className="text-[11px] text-slate-400">
                    Alertas AURA
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    1 suave
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <h4 className="text-xs font-semibold text-slate-700">
                  Puntos a observar
                </h4>
                <ul className="mt-1.5 space-y-1.5 text-xs text-slate-600">
                  <li>
                    Tendencia de ánimo: {moodTrendLabel(selected.moodTrend).toLowerCase()} en los
                    últimos días.
                  </li>
                  <li>
                    AURA ha detectado patrones relacionados con: {selected.tags.join(', ')}.
                  </li>
                  <li>
                    Revisar calidad de sueño y manejo de estrés en próxima sesión.
                  </li>
                </ul>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <h4 className="text-xs font-semibold text-slate-700">
                  Próximos pasos sugeridos
                </h4>
                <ul className="mt-1.5 space-y-1.5 text-xs text-slate-600">
                  <li>Revisar el resumen detallado de conversaciones de la última semana.</li>
                  <li>Explorar ejercicios sugeridos por AURA y adherencia de la persona.</li>
                  <li>
                    Definir un objetivo concreto para las próximas dos semanas junto a la persona.
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <Link
                href={`/chat?userId=${selected.id}`}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
              >
                Ir al chat con esta persona
              </Link>
              <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-950">
                Marcar para seguimiento
              </button>
              <button className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                Exportar resumen
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
