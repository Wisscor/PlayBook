from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt, JWTError
from passlib.context import CryptContext
from .config import settings

from colorama import init, Fore
init(autoreset=True)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    print(f'before hashing : {Fore.CYAN}`{plain_password}`')
    hashed = pwd_context.hash(secret=plain_password)
    print(f'after hashing : {Fore.CYAN}`{hashed}`')
    return hashed


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(secret=plain_password, hash=hashed_password)




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
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)



def create_refresh_token(subject: str | int) -> str:
    expire = datetime.now(tz=timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    payload = {'sub': str(subject), 'exp': expire, 'type': 'refresh'}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)

def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}")