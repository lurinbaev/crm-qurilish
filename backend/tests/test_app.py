import os

os.environ["DATABASE_URL"] = "postgresql+psycopg://test:test@127.0.0.1:5432/test"
os.environ["JWT_SECRET"] = "test-only-secret-that-is-long-enough-1234567890"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_expected_api_routes_are_registered():
    paths = app.openapi()["paths"]

    assert "/api/v1/auth/login" in paths
    assert "/api/v1/crm/arizalar" in paths
    assert "/api/v1/companies/{slug}/majmualar" in paths
