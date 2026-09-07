from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "PlayBook"
    debug: bool = True
    database_url: str
    algorithm: str
    secret_key: str
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # Session
    session_cookie_name: str = "session_id"
    session_expire_days: int = 7
    session_cookie_secure: bool = False  # True in production with HTTPS
    session_cookie_http_only: bool = True
    session_cookie_same_site: Literal['lax', 'strict', 'none'] = "lax"


settings = Settings()
