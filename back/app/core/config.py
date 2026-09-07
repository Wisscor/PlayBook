from pydantic_settings import BaseSettings, SettingsConfigDict



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


settings = Settings()
