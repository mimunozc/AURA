"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    const handleClick = (e: Event) => {
      const a = e.target as HTMLAnchorElement;
      if (a?.getAttribute?.("href")?.startsWith("#")) {
        e.preventDefault();
        const id = a.getAttribute("href")!;
        const el = document.querySelector(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <main className="bg-stone-50 text-stone-800 antialiased">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 w-full bg-white/95 shadow-sm backdrop-blur-sm">
        <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <Link href="/" className="text-2xl font-bold text-teal-700">
            AURA
          </Link>
          <div className="hidden space-x-6 md:flex">
            <a href="#caracteristicas" className="text-stone-600 hover:text-teal-600">Características</a>
            <a href="#respaldo" className="text-stone-600 hover:text-teal-600">Respaldo</a>
            <a href="#crisis" className="text-stone-600 hover:text-teal-600">Ayuda</a>
          </div>
          <Link
            href="/login"
            className="rounded-full bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            Probar AURA
          </Link>
        </nav>
      </header>

      {/* ===== HERO ===== */}
      <section
        id="hero"
        className="flex min-h-[88vh] items-center bg-gradient-to-b from-white to-stone-50 py-16 md:py-24"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 md:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border border-stone-200">
              Bienestar • Acompañamiento • Confidencial
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
              Tu compañero de IA para la paz mental y el bienestar emocional, 24/7
            </h1>
            <p className="mt-4 text-lg leading-7 text-stone-700">
              Ansiedad, estrés, soledad. Te escuchamos. Un espacio de apoyo instantáneo, sin juicio y
              con prácticas basadas en evidencia para recuperar tu equilibrio.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-teal-600 px-6 py-3 text-white font-semibold shadow-xl transition-transform hover:scale-105 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                Probar gratis
              </Link>
              <span className="text-sm text-stone-500">Es gratis • Sin tarjeta</span>
            </div>
          </div>

          {/* Ventana del chat simulada */}
          <div className="rounded-2xl border border-stone-200 bg-stone-100 p-4 shadow-md">
            <div className="aspect-[16/10] w-full rounded-xl border border-stone-200 bg-white p-4 flex flex-col gap-3">
              <div className="h-3 w-24 rounded-full bg-stone-200" />
              <div className="h-3 w-32 rounded-full bg-stone-200" />
              <div className="flex-1 rounded-lg bg-stone-50 border border-stone-200" />
              <div className="h-10 rounded-lg bg-teal-600/15 border border-teal-600/30" />
            </div>
            <p className="mt-2 text-center text-sm text-stone-500">
              Interfaz simple para conversaciones significativas.
            </p>
          </div>
        </div>
      </section>

      {/* ===== CARACTERÍSTICAS ===== */}
      <section id="caracteristicas" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-stone-900">El cuidado integral que necesitas</h2>
            <p className="mt-3 text-lg text-stone-600">Un enfoque 360° para tu bienestar.</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "🗣️", title: "Apoyo emocional", desc: "Conversaciones disponibles cuando las necesites." },
              { icon: "🛠️", title: "Prácticas basadas en evidencia", desc: "Técnicas de TCC y mindfulness accesibles." },
              { icon: "🎯", title: "Autoconocimiento", desc: "Check-ins y journaling para entender tus patrones." },
              { icon: "🔒", title: "Privacidad", desc: "Tu información es tratada con respeto y cuidado." },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:ring-2 hover:ring-teal-100"
              >
                <div className="text-4xl" aria-hidden>{f.icon}</div>
                <h3 className="mt-3 text-lg font-semibold text-stone-900">{f.title}</h3>
                <p className="mt-1 text-stone-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== RESPALDO + FRASE ===== */}
      <section id="respaldo" className="bg-white py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900">
              La tranquilidad de contar con respaldo profesional
            </h2>
            <p className="mt-4 text-lg text-stone-600">
              Nuestras orientaciones se inspiran en guías clínicas, TCC y mindfulness. AURA no reemplaza atención
              profesional; busca ser un apoyo cercano y práctico para tu día a día.
            </p>
            <ul className="mt-6 space-y-3 text-stone-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-600">✓</span>
                Meditaciones y respiración consciente para ansiedad y estrés.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-600">✓</span>
                Psicoeducación clara, adaptada a tu proceso personal.
              </li>
            </ul>
          </div>

          {/* Bloque con frase (sustituye imagen) */}
          <div className="rounded-xl bg-teal-50 p-8 shadow-lg">
            <blockquote className="border-l-4 border-teal-500 pl-6 text-xl font-medium italic text-teal-900">
              “La resiliencia no es la ausencia de dolor, sino la capacidad de afrontarlo con las herramientas adecuadas.”
            </blockquote>
          </div>
        </div>
      </section>

      {/* ===== MANEJO DE CRISIS ===== */}
      <section id="crisis" className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-8 text-center shadow-lg">
            <h3 className="text-2xl font-bold text-red-900">IMPORTANTE: ESTO NO ES UNA LÍNEA DE CRISIS</h3>
            <p className="mt-4 text-red-800">
              La IA puede ser un apoyo valioso para el bienestar diario, pero <strong>no sustituye</strong> a un profesional de la salud mental en crisis.
            </p>
            <p className="mt-4 text-red-800">
              Si tu vida o la de alguien está en peligro inminente, busca ayuda de inmediato:
            </p>
            <a
              href="tel:131"
              className="mt-6 inline-block rounded-full bg-red-700 px-8 py-3 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Llama ahora al 131
            </a>
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="bg-stone-100 py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900">
            Empieza a sentirte mejor hoy
          </h2>
          <p className="mt-3 text-lg text-stone-600">
            Conversaciones ilimitadas y herramientas esenciales. <strong>Es gratis.</strong>
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className="rounded-full bg-teal-600 px-10 py-4 text-lg font-semibold text-white shadow-xl transition-transform hover:scale-105 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Empezar ahora
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-stone-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-sm text-stone-500">
          <p>© {new Date().getFullYear()} AURA</p>
          <nav className="flex gap-4">
            <Link href="/login" className="hover:text-stone-800">Probar</Link>
            <Link href="/chat" className="hover:text-stone-800">Chat</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
