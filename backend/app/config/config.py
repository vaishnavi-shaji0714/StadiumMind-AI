import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    GROK_API_KEY: str = ""
    JWT_SECRET: str = "super-secret-jwt-key-stadiummind"
    DATABASE_URL: str = "sqlite:///./stadiummind.db"
    API_BASE_URL: str = "http://localhost:8000"
    FRONTEND_ORIGINS: str = "http://localhost:8443,http://127.0.0.1:8443"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# GROK_API_KEY is kept for compatibility with the existing .env file.
settings.GROQ_API_KEY = settings.GROQ_API_KEY or settings.GROK_API_KEY

if not settings.GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY is not set. The AI service will use simulation mode.")

def get_frontend_origins() -> list[str]:
    return [origin.strip() for origin in settings.FRONTEND_ORIGINS.split(",") if origin.strip()]
