import uuid, datetime
from .session import SessionLocal
from .models import User, Conversation, Message

def seed():
    db = SessionLocal()
    uid = "demo-user"
    cid = "conv-demo"
    if not db.query(User).filter_by(id=uid).first():
        db.add(User(id=uid, display_name="Demo"))
        db.add(Conversation(id=cid, user_id=uid, title="Primera charla"))
        db.add(Message(id=str(uuid.uuid4()), conv_id=cid, role="assistant",
                       text="Hola, soy AURA. ¿Seguimos por aquí o quieres comenzar por algo de hoy?"))
        db.commit()
    db.close()
