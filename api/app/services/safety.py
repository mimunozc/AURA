def safety_check(text:str)->dict:
    t = text.lower()
    high = any(k in t for k in ["suicid", "quitarme la vida", "hacerme daño", "matarme"])
    if high:
        return {"flag": True, "reason":"self-harm"}
    return {"flag": False}
