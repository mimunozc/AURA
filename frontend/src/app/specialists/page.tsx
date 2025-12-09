'use client';

import Header from "@/components/Header";
import Link from "next/link";

type DemoSpecialist = {
  id: string;
  name: string;
  speciality: string;
  focus: string;
  yearsExperience: number;
  modality: string;
};

const DEMO_SPECIALISTS: DemoSpecialist[] = [
  {
    id: "s1",
    name: "Dr. Rodrigo Silva",
    speciality: "Psiquiatría",
    focus: "Ansiedad, sueño y regulación emocional",
    yearsExperience: 10,
    modality: "Online"
  },
  {
    id: "s2",
    name: "Ps. Daniela Contreras",
    speciality: "Psicología clínica",
    focus: "Depresión leve a moderada, autoestima",
    yearsExperience: 6,
    modality: "Mixto"
  },
  {
    id: "s3",
    name: "Ps. Felipe Arancibia",
    speciality: "Psicología infantil y adolescente",
    focus: "Regulación emocional, familia y colegio",
    yearsExperience: 8,
    modality: "Online"
  }
];

const PRIMARY_SPECIALIST_ID = "s1";
const primarySpecialist = DEMO_SPECIALISTS.find(s => s.id === PRIMARY_SPECIALIST_ID) ?? DEMO_SPECIALISTS[0];

export default function MySpecialistsPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Mis especialistas
            </h1>
            <p className="text-sm text-brand-subtext">
              AURA se integra con tu equipo de apoyo humano. 
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-subtext">
              Tu especialista principal
            </p>
            <p className="mt-1 text-sm font-semibold text-brand-text">
              {primarySpecialist.name}
            </p>
            <p className="text-xs text-brand-subtext">
              {primarySpecialist.speciality} · {primarySpecialist.focus}
            </p>
          </div>
          <Link
            href={`/chat?specialistId=${primarySpecialist.id}`}
            className="inline-flex items-center justify-center rounded-xl bg-brand-button-bg px-4 py-2 text-sm font-medium text-brand-button-text hover:bg-brand-button-bg-hover"
          >
            Contactar
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {DEMO_SPECIALISTS.map(s => (
            <div
              key={s.id}
              className="flex flex-col justify-between rounded-2xl border border-brand-border bg-white p-4 shadow-sm"
            >
              <div>
                <h2 className="text-sm font-semibold text-brand-text">
                  {s.name}
                </h2>
                <p className="text-xs text-brand-subtext">
                  {s.speciality}
                </p>
                <p className="mt-2 text-xs text-brand-text">
                  Enfoque: {s.focus}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-brand-subtext">
                <span>{s.yearsExperience} años de experiencia</span>
                <span>{s.modality}</span>
              </div>
              <Link
                href={`/chat?specialistId=${s.id}`}
                className="mt-3 inline-flex items-center justify-center rounded-xl bg-brand-bg px-3 py-1.5 text-xs font-medium text-brand-text hover:bg-slate-100"
              >
                Ir al chat con AURA sobre {s.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
