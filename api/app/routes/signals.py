from fastapi import APIRouter
from ..db.session import SessionLocal
from ..db.models import Signal

router = APIRouter(prefix="/signals", tags=["signals"])

@router.get("/daily")
def daily(userId: str, dateFrom: str, dateTo: str):
    db = SessionLocal()
    rows = db.query(Signal).filter(
        Signal.user_id == userId,
        Signal.date >= dateFrom,
        Signal.date <= dateTo
    ).all()
    agg = {}
    for r in rows:
        agg.setdefault(r.date, {}).setdefault(r.facet, []).append((r.value, r.confidence, r.source))
    # elige el valor con mayor confianza por facet
    out = []
    for d, facets in sorted(agg.items()):
        fused = {}
        for f, vals in facets.items():
            vals.sort(key=lambda x: x[1], reverse=True)
            fused[f] = {"value": vals[0][0], "confidence": vals[0][1]}
        out.append({"date": d, "facets": fused})
    db.close()
    return out
