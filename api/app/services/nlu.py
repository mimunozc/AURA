import re
def infer_signals(text:str):
    t = text.lower()
    sig = []
    if re.search(r"(insomnio|no dorm|me desvelo|despert|pesadill)", t):
        sig.append(("sleep","poor",0.7))
    if re.search(r"(cansad[oa]|sin energía|agotad[oa])", t):
        sig.append(("energy","low",0.6))
    if re.search(r"(estrés|estresad[oa]|ansiedad|ansios[oa])", t):
        sig.append(("stress","high",0.65))
    if re.search(r"(gimn|ejerc|caminar|salí a correr)", t):
        sig.append(("activity","some",0.55))
    if re.search(r"(no quiero ver a nadie|evito|solo)", t):
        sig.append(("social","low",0.55))
    return sig

def evasive(text:str)->bool:
    return text.strip().lower() in ["bien","ok","no sé","nada","todo bien","meh","xD".lower(),"jaja","ja"]
