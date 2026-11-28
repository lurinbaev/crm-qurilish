import pytest

from scripts.seed_demo import require_test_target


def test_demo_seed_never_falls_back_to_application_database(monkeypatch):
    monkeypatch.delenv("SEED_DATABASE_URL", raising=False)
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://prod:secret@db/crm_test")
    monkeypatch.setenv("ENVIRONMENT", "test")
    monkeypatch.setenv("SEED_CONFIRM_TEST_DB", "YES")

    with pytest.raises(SystemExit, match="SEED_DATABASE_URL is required"):
        require_test_target()


def test_demo_seed_rejects_non_test_database_name(monkeypatch):
    monkeypatch.setenv("SEED_DATABASE_URL", "postgresql+psycopg://test:test@localhost/crm_prod")
    monkeypatch.setenv("ENVIRONMENT", "test")
    monkeypatch.setenv("SEED_CONFIRM_TEST_DB", "YES")
    monkeypatch.setenv("SEED_ADMIN_PASSWORD", "secret-admin-123")
    monkeypatch.setenv("SEED_SELLER_PASSWORD", "secret-seller-123")
    monkeypatch.setenv("SEED_VIEWER_PASSWORD", "secret-viewer-123")

    with pytest.raises(SystemExit, match="test marker"):
        require_test_target()
