from fastapi import APIRouter
from pydantic import BaseModel
import uuid, datetime
from ..db.session import SessionLocal
from ..db.models import JournalEntry, Signal
from ..services.nlu import infer_signals

router = APIRouter(prefix="/journal", tags=["journal"])

class AddReq(BaseModel):
    userId: str
    text: str

@router.post("/add")
def add(req: AddReq):
    db = SessionLocal()
    now = datetime.datetime.utcnow()
    jid = str(uuid.uuid4())
    entry = JournalEntry(id=jid, user_id=req.userId, text=req.text, ts=now)
    db.add(entry)
    date = now.strftime("%Y-%m-%d")
    for facet, value, conf in infer_signals(req.text):
        db.add(Signal(id=str(uuid.uuid4()), user_id=req.userId, date=date,
                      facet=facet, value=value, confidence=conf, source="journal",
                      origin_message_id=None))
    db.commit()
    db.close()
    return {"id": jid, "ts": now.isoformat()}

@router.get("/list")
def list_entries(userId: str, limit: int = 20):
    db = SessionLocal()
    rows = db.query(JournalEntry).filter_by(user_id=userId).order_by(JournalEntry.ts.desc()).limit(limit).all()
    out = [{"id": r.id, "text": r.text, "ts": r.ts.isoformat()} for r in rows]
    db.close()
    return out
