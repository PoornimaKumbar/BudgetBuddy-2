import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@127.0.0.1:5432/budgetbuddy_db"
    SECRET_KEY: str = "budgetbuddy_super_secret_jwt_key_2026_finance_prod"
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
    SENDLIB_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
