from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path
import os

# Directorio raíz del servicio API (…/api)
API_ROOT = Path(__file__).resolve().parents[1]

# Ruta absoluta a /api/data/aura.db
DB_PATH = API_ROOT / "data" / "aura.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)  # crea /api/data si no existe

# OJO: usar 3 slashes y path en formato POSIX para SQLite
DB_URL = f"sqlite:///{DB_PATH.as_posix()}"

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
