import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GROK_API_KEY: str = ""
    JWT_SECRET: str = "super-secret-jwt-key-stadiummind"
    DATABASE_URL: str = "sqlite:///./stadiummind.db"
    API_BASE_URL: str = "http://localhost:8000"
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
# Check if key is loaded (for warning / logging)
if not settings.GROK_API_KEY:
    print("WARNING: GROK_API_KEY is not set in environment variables or .env!")
