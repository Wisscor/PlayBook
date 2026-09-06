from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt, JWTError
from passlib.context import CryptContext

# from .config import get_settings
# 
# settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


ALGORITHM = "HS256"


# `subject` is the unique identifier for the user (like user ID or username)
# `exp` is the expiration time — the JWT spec uses Unix timestamps, but python-jose accepts `datetime` obj
def create_access_token(
    subject: str| int,
    expires_delta: timedelta | None = None,
):
    expire = datetime.now(tz=timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload = {'sub': str(subject), 'exp': expire, 'type': 'access'}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)



def create_refresh_token(subject: str | int) -> str:
    expire = datetime.now(tz=timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    payload = {'sub': str(subject), 'exp': expire, 'type': 'refresh'}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)

def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}")