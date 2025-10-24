from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.session import Base, engine
from .db.seed import seed
from .routes import chat
from .routes import health, journal, checkin, signals
from .routes import auth

app = FastAPI(title="AURA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
seed()

app.include_router(health.router)
app.include_router(auth.router) 
app.include_router(chat.router)
app.include_router(journal.router)
app.include_router(checkin.router)
app.include_router(signals.router)
