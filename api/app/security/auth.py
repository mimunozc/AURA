# app/security/auth.py
import os
from fastapi import Header, HTTPException

API_DEV_TOKEN = os.getenv("API_DEV_TOKEN", "dev-token-123")
AUTH_SCHEME = os.getenv("AUTH_SCHEME", "Bearer")  # "Bearer" o "" si quieres valor plano
HEADER_NAME = os.getenv("AUTH_HEADER", "Authorization")  # "Authorization" o "x-api-key"

def _extract_token_from_authorization(value: str) -> str:
    if AUTH_SCHEME and value.startswith(f"{AUTH_SCHEME} "):
        return value.split(" ", 1)[1]
    return value

async def verify_token(
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None)
):
    header = (HEADER_NAME or "Authorization").lower()
    raw = authorization if header == "authorization" else x_api_key

    if not raw:
        raise HTTPException(status_code=401, detail="Unauthorized")

    token = _extract_token_from_authorization(raw)
    if token != API_DEV_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")
