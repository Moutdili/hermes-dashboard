"""Configuration centralisée — pydantic-settings (charge .env)."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 8899
    debug: bool = False

    # PostgreSQL (via SSH tunnel — no default, must be set in env)
    pg_host: str = "localhost"
    pg_port: int = 5433
    pg_user: str = "vv_admin"
    pg_password: str = ""  # REQUIRED — set DASH_PG_PASSWORD in .env
    pg_database: str = "ville_en_vogue"

    # Auth
    tailscale_enabled: bool = True
    default_ip: str = "127.0.0.1"  # fallback when client IP unresolvable

    # CORS
    cors_origins: str = "http://localhost:3000"  # comma-separated

    model_config = SettingsConfigDict(env_file=".env", env_prefix="DASH_")


settings = Settings()

# Validate that password is set
if not settings.pg_password:
    raise RuntimeError(
        "DASH_PG_PASSWORD is required. Set it in backend/.env or environment."
    )
