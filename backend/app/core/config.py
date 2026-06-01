# Reads environment variables from .env and exposes them as typed settings
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str           # PostgreSQL connection string
    JWT_SECRET: str             # Secret key used to sign JWTs
    JWT_EXPIRE_DAYS: int = 7    # How long a token stays valid
    ADMIN_SECRET: str = "warehouse-admin-2024"  # One-time secret for admin setup

    class Config:
        env_file = ".env"


# Single shared instance — import this everywhere instead of re-creating
settings = Settings()
