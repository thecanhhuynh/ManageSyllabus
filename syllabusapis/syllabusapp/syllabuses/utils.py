import time
from django.conf import settings
import jwt


def generate_onlyoffice_token(payload: dict) -> str:
    """Tạo JWT token ký bằng ONLYOFFICE_JWT_SECRET."""
    token_payload = payload.copy()
    token_payload["exp"] = int(time.time()) + (2 * 3600)
    return jwt.encode(
        token_payload, settings.ONLYOFFICE_JWT_SECRET, algorithm="HS256"
    )


def decode_onlyoffice_token(token: str) -> dict:
    return jwt.decode(
        token, settings.ONLYOFFICE_JWT_SECRET, algorithms=["HS256"]
    )