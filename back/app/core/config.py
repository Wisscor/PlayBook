from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "PlayBook"
    debug: bool = False
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = (
        "INFO"
    )

    database_url: str

    session_cookie_name: str = "session_id"
    session_expire_days: int = 7
    session_cookie_secure: bool = False
    session_cookie_http_only: bool = True
    session_cookie_same_site: Literal["lax", "strict", "none"] = "lax"

    cors_origins: list[str] = [
        "http://localhost:3443",
    ]


settings = Settings()
