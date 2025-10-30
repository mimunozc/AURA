// components/AuraLanding.tsx
export default function AuraLanding() {
  return (
    <div className="space-y-16 pb-16">
      {/* HERO */}
      <section id="hero" className="bg-gradient-to-b from-white to-stone-50 px-6 py-10">
        <h1 className="text-3xl font-extrabold text-stone-900 md:text-4xl">
          Tu compañero de IA para la paz mental, 24/7
        </h1>
        <p className="mt-4 text-stone-600">
          Ansiedad, estrés, soledad. Te escuchamos sin juicio y con herramientas reales.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700">
            Empezar gratis
          </button>
          <a href="#caracteristicas" className="rounded-full bg-stone-100 px-6 py-3 text-sm font-medium text-stone-700 hover:bg-stone-200">
            Ver características
          </a>
        </div>
      </section>

      {/* CARACTERISTICAS (tu sección 2 resumida) */}
      <section id="caracteristicas" className="px-6">
        <h2 className="text-xl font-semibold text-stone-900">Cuidado integral</h2>
        <p className="mt-2 text-sm text-stone-500">Lo mismo que en tu HTML, pero compacto.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-3xl">🗣️</div>
            <h3 className="mt-3 text-base font-semibold text-stone-900">Apoyo emocional</h3>
            <p className="mt-2 text-sm text-stone-600">
              Conversaciones guiadas para desahogarte y ordenar lo que sientes.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-3xl">🛠️</div>
            <h3 className="mt-3 text-base font-semibold text-stone-900">Herramientas TCC</h3>
            <p className="mt-2 text-sm text-stone-600">
              Ejercicios concretos para pensamientos y emociones difíciles.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-3xl">🎯</div>
            <h3 className="mt-3 text-base font-semibold text-stone-900">Personalización</h3>
            <p className="mt-2 text-sm text-stone-600">
              Se adapta a tu registro de ánimo y tus metas.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-3xl">🔒</div>
            <h3 className="mt-3 text-base font-semibold text-stone-900">Confidencial</h3>
            <p className="mt-2 text-sm text-stone-600">
              Interacciones seguras y privadas.
            </p>
          </div>
        </div>
      </section>

      {/* CRISIS */}
      <section id="crisis" className="px-6">
        <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-5">
          <h3 className="text-base font-bold text-red-900">Importante</h3>
          <p className="mt-2 text-sm text-red-800">
            AURA no reemplaza atención de urgencia. Si estás en crisis, contacta un profesional o tu número local.
          </p>
        </div>
      </section>
    </div>
  );
}
