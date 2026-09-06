import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./budgetbuddy.db"
    SECRET_KEY: str = "dev_secret_key_only_for_local_testing"
    FRONTEND_URL: str = "http://localhost:5173"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    OTP_EXPIRE_MINUTES: int = 5

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "noreply.budgetbuddy@gmail.com"
    EMAILS_FROM_NAME: str = "BudgetBuddy"
    
    ADMIN_REGISTRATION_KEY: str = "budgetbuddy_admin_secret"
    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
