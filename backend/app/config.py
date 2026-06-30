"""Configuration centralisée — pydantic-settings (charge .env)."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 8899
    debug: bool = False

    # PostgreSQL (vv-db via tunnel)
    pg_host: str = "localhost"
    pg_port: int = 5433
    pg_user: str = "vv_admin"
    pg_password: str = "vv_admin_secret"
    pg_database: str = "ville_en_vogue"

    # Auth
    tailscale_enabled: bool = True

    class Config:
        env_file = ".env"
        env_prefix = "DASH_"


settings = Settings()