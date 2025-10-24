from fastapi import APIRouter
from pydantic import BaseModel
import uuid, datetime
from ..db.session import SessionLocal
from ..db.models import CheckIn, Signal

router = APIRouter(prefix="/checkin", tags=["checkin"])

class SubmitReq(BaseModel):
    userId: str
    date: str            # YYYY-MM-DD
    mood: str            # low|ok|high
    sleep: str           # poor|ok|good
    energy: str          # low|ok|high
    stress: str          # low|med|high
    notes: str | None = None

@router.post("/submit")
def submit(req: SubmitReq):
    db = SessionLocal()
    cid = str(uuid.uuid4())
    ci = CheckIn(id=cid, user_id=req.userId, date=req.date, mood=req.mood,
                 sleep=req.sleep, energy=req.energy, stress=req.stress, notes=req.notes)
    # upsert simple: elimina previo del día si existe
    db.query(CheckIn).filter_by(user_id=req.userId, date=req.date).delete()
    db.add(ci)
    # señales derivadas del check-in (confianza 1.0)
    facets = [("mood", req.mood), ("sleep", req.sleep), ("energy", req.energy), ("stress", req.stress)]
    for facet, value in facets:
        db.add(Signal(id=str(uuid.uuid4()), user_id=req.userId, date=req.date,
                      facet=facet, value=value, confidence=1.0, source="checkin",
                      origin_message_id=None))
    db.commit()
    db.close()
    return {"id": cid}
