from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from environment / .env file."""

    env: str = "development"
    app_name: str = "NexShop API"
    app_version: str = "1.0.0"

    database_url: str = "postgresql+psycopg://shop:shop@localhost:5432/nexshop"
    auto_create_tables: bool = True
    auto_seed: bool = True

    jwt_secret: str = "change-me-to-a-long-random-string-32+"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60
    refresh_token_days: int = 30

    cors_origins: str = "*"
    frontend_url: str = "http://localhost:8081"

    stripe_webhook_secret: str = ""

    # Email (SMTP) — when disabled, emails are logged to console (dev-friendly)
    email_enabled: bool = False
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "NexShop <no-reply@nexshop.local>"
    smtp_starttls: bool = True

    # Uploads (product images etc.)
    upload_dir: str = "uploads"
    max_upload_mb: int = 5

    # Security
    rate_limit_enabled: bool = True
    password_reset_minutes: int = 60

    port: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        if self.cors_origins.strip() in ("", "*"):
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.env.lower() in ("production", "prod")


@lru_cache
def get_settings() -> Settings:
    return Settings()
