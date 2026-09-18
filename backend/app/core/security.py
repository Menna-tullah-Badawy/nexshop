import bcrypt
import jwt
from datetime import datetime, timedelta, timezone

from .config import get_settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_token(sub: str, role: str, kind: str, expires_delta: timedelta) -> str:
    settings = get_settings()
    payload = {
        "sub": sub,
        "role": role,
        "type": kind,
        "iat": _now(),
        "exp": _now() + expires_delta,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(sub: str, role: str) -> str:
    settings = get_settings()
    return create_token(sub, role, "access", timedelta(minutes=settings.access_token_minutes))


def create_refresh_token(sub: str, role: str) -> str:
    settings = get_settings()
    return create_token(sub, role, "refresh", timedelta(days=settings.refresh_token_days))


def decode_token(token: str) -> dict:
    """Decode & verify a JWT. Raises jwt.PyJWTError on failure."""
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
