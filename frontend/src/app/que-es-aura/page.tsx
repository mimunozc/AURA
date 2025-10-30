export default function QueEsAuraPage() {
  return (
    <div className="mx-auto max-w-3xl py-10 px-4 space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">¿Qué es AURA?</h1>
      <p className="text-slate-700">
        AURA es un acompañante de bienestar emocional pensado para que puedas hablar en español, de forma simple,
        cuando lo necesites. Registra tu estado de ánimo, te hace seguimiento y adapta las preguntas según lo que ya
        contaste.
      </p>
      <p className="text-slate-700">
        La versión que estás viendo se conecta a un servicio de IA que puede usar OpenAI (con tu API key) o un modelo
        local, según la configuración del backend.
      </p>
    </div>
  );
}
