"""Create or extend the root .env without replacing existing settings."""

from pathlib import Path
import secrets
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env"


def main() -> None:
    current = ENV_FILE.read_text(encoding="utf-8") if ENV_FILE.exists() else ""
    existing = {
        line.split("=", 1)[0]
        for line in current.splitlines()
        if "=" in line and not line.lstrip().startswith("#")
    }
    old_database_url = next(
        (
            line.split("=", 1)[1]
            for line in current.splitlines()
            if line.startswith("DATABASE_URL=")
        ),
        "",
    )
    old_url = urlsplit(old_database_url) if old_database_url else None
    legacy_password = unquote(old_url.password) if old_url and old_url.password else ""
    legacy_user = unquote(old_url.username) if old_url and old_url.username else "crm_owner"
    legacy_database = unquote(old_url.path.lstrip("/")) if old_url and old_url.path else "crm_course_v3"
    had_existing_env = ENV_FILE.exists()

    values = {
        "POSTGRES_DB": legacy_database,
        "POSTGRES_USER": legacy_user,
        "POSTGRES_PASSWORD": legacy_password or secrets.token_urlsafe(32),
        "JWT_SECRET": secrets.token_urlsafe(48),
        "CORS_ORIGINS": '["http://localhost:3000"]',
        "ENVIRONMENT": "development",
        "APP_IMAGE": "construction-crm:local",
    }
    # Existing installations keep using their original database owner and password by
    # default. New installs get separate migration and runtime roles on first DB init.
    if not had_existing_env:
        values.update(
            {
                "MIGRATION_DB_USER": "crm_migrator",
                "MIGRATION_DB_PASSWORD": secrets.token_urlsafe(32),
                "APP_DB_USER": "crm_app",
                "APP_DB_PASSWORD": secrets.token_urlsafe(32),
            }
        )

    for line in current.splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            values[key] = value
    if "DATABASE_URL" not in values:
        app_user = values.get("APP_DB_USER", values["POSTGRES_USER"])
        app_password = values.get("APP_DB_PASSWORD", values["POSTGRES_PASSWORD"])
        values["DATABASE_URL"] = (
            "postgresql+psycopg://"
            f"{app_user}:{app_password}@localhost:5432/{values['POSTGRES_DB']}"
        )

    missing = [key for key in values if key not in existing]
    if not missing:
        print(".env already has the required settings; left unchanged")
        return

    addition = "\n".join(f"{key}={values[key]}" for key in missing) + "\n"
    if current and not current.endswith(("\n", "\r")):
        current += "\n"
    ENV_FILE.write_text(current + addition, encoding="utf-8")
    action = "Updated" if existing else "Created"
    print(f"{action} .env with missing settings and generated secrets")


if __name__ == "__main__":
    main()
