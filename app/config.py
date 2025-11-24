from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str  # For environment variable OPENAI_API_KEY

    model_config = SettingsConfigDict(
        env_file=".env",          # For loading environment variables from a .env file in local development
        env_file_encoding="utf-8"
    )


settings = Settings()
