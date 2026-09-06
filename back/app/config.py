SECRET_KEY = "C_-9v5j5mAxkFHofwq4lYtP5NapGlyWYlfim40rA5JI"


class BaseSettings:
    PROJECT_NAME: str = "ft_trancendance"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30 minutes
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 days


class Settings(BaseSettings):
    secret_key: str = SECRET_KEY  # 32+ random characters
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
