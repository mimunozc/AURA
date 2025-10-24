# app/routes/auth.py
from fastapi import APIRouter
import os

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/dev")
def get_dev_token():
    token = os.getenv("API_DEV_TOKEN", "dev-token-123")
    return {"token": token}
