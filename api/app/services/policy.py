from datetime import datetime, timedelta

def cadence_ok(messages)->bool:
    # máx una pregunta cada 4 turnos: contamos últimas 4 respuestas del asistente
    last_assistant = [m for m in messages if m["role"]=="assistant"][-4:]
    questions = [m for m in last_assistant if m["asked_question"]]
    return len(questions)==0

def pick_question(signals):
    # elige UNA pregunta concreta según la señal más fuerte
    for facet, value, conf in signals:
        if facet=="sleep":   return "¿Fue más difícil conciliar el sueño o te despertaste durante la noche?"
        if facet=="stress":  return "¿Dirías que el estrés viene más de trabajo/estudios o de algo personal?"
        if facet=="energy":  return "¿La baja de energía te acompaña todo el día o solo en ciertas horas?"
        if facet=="social":  return "¿Te ayudaría hablarlo con alguien de confianza o prefieres ordenarlo aquí?"
        if facet=="activity":return "¿Sientes que moverte un poco te ayudaría hoy, aunque sea una caminata corta?"
    return None
