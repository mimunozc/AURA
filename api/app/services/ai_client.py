import requests, os
AI_URL = os.getenv("AI_URL", "http://localhost:8002")  # ajusta al puerto de tu servicio ai

def generate_reply(history, user_msg, system_prompt, followup_question=None):
    payload = {
        "system": system_prompt,
        "history": history,         # [{role, content}]
        "user": user_msg,
        "followup": followup_question
    }
    r = requests.post(f"{AI_URL}/chat", json=payload, timeout=30)
    r.raise_for_status()
    return r.json()  # {reply: str}
