from sqlalchemy import Column, Text, DateTime, ForeignKey, CheckConstraint, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from .session import Base


class User(Base):
    __tablename__ = "Users"
    id = Column(Text, primary_key=True)
    display_name = Column(Text, nullable=True)
    tz = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Conversation(Base):
    __tablename__ = "Conversations"
    id = Column(Text, primary_key=True)
    user_id = Column(Text, ForeignKey("Users.id"), nullable=False)
    title = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)

class Message(Base):
    __tablename__ = "Messages"
    id = Column(Text, primary_key=True)
    conv_id = Column(Text, ForeignKey("Conversations.id"), nullable=False)
    role = Column(Text, nullable=False)  # 'user' | 'assistant' | 'system'
    text = Column(Text, nullable=False)
    ts = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (CheckConstraint("role in ('user','assistant','system')"),)

class Signal(Base):
    __tablename__ = "Signals"
    id = Column(Text, primary_key=True)
    user_id = Column(Text, ForeignKey("Users.id"), nullable=False)
    date = Column(Text, nullable=False)  # YYYY-MM-DD
    facet = Column(Text, nullable=False)  # mood|energy|sleep|stress|activity|social
    value = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False)
    source = Column(Text, nullable=False)  # chat|checkin|journal
    origin_message_id = Column(Text, ForeignKey("Messages.id"), nullable=True)

class JournalEntry(Base):
    __tablename__ = "Journal"
    id = Column(Text, primary_key=True)
    user_id = Column(Text, ForeignKey("Users.id"), nullable=False)
    text = Column(Text, nullable=False)
    ts = Column(DateTime, default=datetime.utcnow)

class CheckIn(Base):
    __tablename__ = "CheckIns"
    id = Column(Text, primary_key=True)
    user_id = Column(Text, ForeignKey("Users.id"), nullable=False)
    date = Column(Text, nullable=False)  # YYYY-MM-DD
    mood = Column(Text, nullable=False)      # p.ej. low|ok|high
    sleep = Column(Text, nullable=False)     # poor|ok|good
    energy = Column(Text, nullable=False)    # low|ok|high
    stress = Column(Text, nullable=False)    # low|med|high
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_checkin_user_date"),)  
