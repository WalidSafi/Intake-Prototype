"""Central application settings.

Values can be overridden with environment variables prefixed with `NILAB_`,
for example `NILAB_FRONTEND_ORIGIN=http://localhost:5173`.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration shared across the backend."""

    app_name: str = "Nilab Tattoos Intake API"
    api_version: str = "0.1.0"
    frontend_origin: str = "http://localhost:5173"
    default_artist_id: str = "artist_001"
    default_studio_id: str = "studio_001"

    model_config = SettingsConfigDict(env_prefix="NILAB_")


@lru_cache
def get_settings() -> Settings:
    """Return cached settings so env parsing happens once per process."""
    return Settings()
