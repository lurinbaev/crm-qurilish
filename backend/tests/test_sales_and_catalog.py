import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

# Isolated test credentials prevent the repository's developer .env from being used.
os.environ["DATABASE_URL"] = "postgresql+psycopg://test:test@127.0.0.1:5432/test"
os.environ["JWT_SECRET"] = "test-only-secret-that-is-long-enough-1234567890"

from app.core.db import get_session
from app.core.security import passwords
from app.main import app
from app.modules.catalog.models import Apartment, Company, Complex
from app.modules.leads.models import Lead
from app.modules.users.models import User


@pytest.fixture
def crm(monkeypatch: pytest.MonkeyPatch) -> Iterator[tuple[TestClient, dict[str, int]]]:
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://test:test@127.0.0.1:5432/test")
    monkeypatch.setenv("JWT_SECRET", "test-only-secret-that-is-long-enough-1234567890")
    from app.core.config import settings

    settings.cache_clear()
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, _record):
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        company = Company(slug="sinov-qurilish", name="Sinov Qurilish")
        session.add(company)
        session.flush()
        complex_ = Complex(company_id=company.id, name="Bog‘ishamol turar joy majmuasi")
        admin = User(
            company_id=company.id,
            username="admin.sinov",
            password_hash=passwords.hash("Sinov-admin-parol-2026!"),
            role="admin",
        )
        seller = User(
            company_id=company.id,
            username="sotuvchi.sinov",
            password_hash=passwords.hash("Sinov-sotuvchi-2026!"),
            role="seller",
        )
        viewer = User(
            company_id=company.id,
            username="kuzatuvchi.sinov",
            password_hash=passwords.hash("Sinov-kuzatuvchi-2026!"),
            role="viewer",
        )
        session.add_all([complex_, admin, seller, viewer])
        session.flush()
        apartment = Apartment(
            company_id=company.id,
            complex_id=complex_.id,
            number="12",
            rooms=3,
            price_uzs=2_450_000_000,
        )
        session.add(apartment)
        session.flush()
        lead = Lead(
            company_id=company.id,
            apartment_id=apartment.id,
            full_name="Dilnoza Rahimova",
            phone="+998000000021",
            stage="viewing",
            source="sinov",
            version=3,
        )
        session.add(lead)
        session.commit()
        ids = {
            "company": company.id,
            "complex": complex_.id,
            "apartment": apartment.id,
            "lead": lead.id,
            "admin": admin.id,
        }

    def override_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    previous = app.dependency_overrides.get(get_session)
    app.dependency_overrides[get_session] = override_session
    try:
        with TestClient(app) as client:
            yield client, ids
    finally:
        if previous is None:
            app.dependency_overrides.pop(get_session, None)
        else:
            app.dependency_overrides[get_session] = previous
        engine.dispose()
        settings.cache_clear()


def token(client: TestClient, username: str, password: str) -> str:
    response = client.post(
        "/api/v1/auth/login", data={"username": username, "password": password}
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def headers(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


def test_sale_confirmation_updates_lead_apartment_and_audit_atomically(crm):
    client, ids = crm
    seller = headers(token(client, "sotuvchi.sinov", "Sinov-sotuvchi-2026!"))

    response = client.post(
        f"/api/v1/crm/arizalar/{ids['lead']}/sale/confirm",
        json={"expected_version": 3},
        headers=seller,
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["lead"]["stage"] == "won"
    assert payload["lead"]["version"] == 4
    assert payload["apartment"]["availability"] == "sold"

    admin = headers(token(client, "admin.sinov", "Sinov-admin-parol-2026!"))
    audit = client.get("/api/v1/crm/audit", headers=admin)
    assert audit.status_code == 200
    assert {row["action"] for row in audit.json()} >= {
        "lead.sale_confirmed",
        "apartment.sold",
    }
    sold_patch = client.patch(
        f"/api/v1/crm/catalog/apartments/{ids['apartment']}",
        json={"rooms": 4},
        headers=admin,
    )
    assert sold_patch.status_code == 409
    sold_price = client.patch(
        f"/api/v1/crm/inventory/apartments/{ids['apartment']}/price",
        json={"price_uzs": 2_600_000_000, "expected_price_uzs": 2_450_000_000},
        headers=admin,
    )
    assert sold_price.status_code == 409
    sold_delete = client.delete(
        f"/api/v1/crm/catalog/apartments/{ids['apartment']}", headers=admin
    )
    assert sold_delete.status_code == 409


def test_sale_confirmation_rejects_stale_version_and_wrong_stage(crm):
    client, ids = crm
    seller = headers(token(client, "sotuvchi.sinov", "Sinov-sotuvchi-2026!"))

    stale = client.post(
        f"/api/v1/crm/arizalar/{ids['lead']}/sale/confirm",
        json={"expected_version": 2},
        headers=seller,
    )
    assert stale.status_code == 409

    lead = client.get(f"/api/v1/crm/arizalar/{ids['lead']}", headers=seller).json()
    client.patch(
        f"/api/v1/crm/arizalar/{ids['lead']}/stage",
        json={"stage": "lost", "expected_version": lead["version"]},
        headers=seller,
    )
    wrong_stage = client.post(
        f"/api/v1/crm/arizalar/{ids['lead']}/sale/confirm",
        json={"expected_version": lead["version"] + 1},
        headers=seller,
    )
    assert wrong_stage.status_code == 409

    apartment = client.get(
        f"/api/v1/crm/catalog/apartments/{ids['apartment']}", headers=seller
    )
    assert apartment.status_code == 403


def test_catalog_mutations_are_admin_only_and_write_audit_records(crm):
    client, ids = crm
    seller = headers(token(client, "sotuvchi.sinov", "Sinov-sotuvchi-2026!"))
    admin = headers(token(client, "admin.sinov", "Sinov-admin-parol-2026!"))

    denied = client.patch(
        f"/api/v1/crm/catalog/apartments/{ids['apartment']}",
        json={"rooms": 4},
        headers=seller,
    )
    assert denied.status_code == 403

    edited = client.patch(
        f"/api/v1/crm/catalog/apartments/{ids['apartment']}",
        json={"number": "12A", "rooms": 4},
        headers=admin,
    )
    assert edited.status_code == 200
    assert edited.json()["number"] == "12A"

    priced = client.patch(
        f"/api/v1/crm/inventory/apartments/{ids['apartment']}/price",
        json={"price_uzs": 2_550_000_000, "expected_price_uzs": 2_450_000_000},
        headers=admin,
    )
    assert priced.status_code == 200
    assert priced.json()["price_uzs"] == 2_550_000_000

    deleted = client.delete(
        f"/api/v1/crm/catalog/apartments/{ids['apartment']}", headers=admin
    )
    assert deleted.status_code == 409  # Existing lead still references the apartment.

    audit = client.get("/api/v1/crm/audit", headers=admin)
    actions = {row["action"] for row in audit.json()}
    assert {"apartment.updated", "apartment.price_changed"} <= actions

    complex_created = client.post(
        "/api/v1/crm/catalog/complexes",
        json={"name": "Yangi Samarqand majmuasi"},
        headers=admin,
    )
    assert complex_created.status_code == 201
    complex_id = complex_created.json()["id"]
    complex_updated = client.put(
        f"/api/v1/crm/catalog/complexes/{complex_id}",
        json={"name": "Yangi Samarqand turar joy majmuasi"},
        headers=admin,
    )
    assert complex_updated.status_code == 200
    assert complex_updated.json()["name"].startswith("Yangi Samarqand")

    apartment_created = client.post(
        "/api/v1/crm/catalog/apartments",
        json={"complex_id": complex_id, "number": "S-01", "rooms": 2, "price_uzs": 650_000_000},
        headers=admin,
    )
    assert apartment_created.status_code == 201
    apartment_id = apartment_created.json()["id"]
    assert client.delete(f"/api/v1/crm/catalog/apartments/{apartment_id}", headers=admin).status_code == 204
    assert client.delete(f"/api/v1/crm/catalog/complexes/{complex_id}", headers=admin).status_code == 204

    actions = {row["action"] for row in client.get("/api/v1/crm/audit", headers=admin).json()}
    assert {"complex.created", "complex.updated", "complex.deleted", "apartment.created", "apartment.deleted"} <= actions


def test_admin_user_management_and_deactivation_audit(crm):
    client, _ids = crm
    admin = headers(token(client, "admin.sinov", "Sinov-admin-parol-2026!"))
    seller = headers(token(client, "sotuvchi.sinov", "Sinov-sotuvchi-2026!"))

    assert client.get("/api/v1/crm/users", headers=seller).status_code == 403
    created = client.post(
        "/api/v1/crm/users",
        json={"username": "yangi.sotuvchi", "password": "Sinov-yangi-2026!", "role": "seller"},
        headers=admin,
    )
    assert created.status_code == 201
    assert created.json()["username"] == "yangi.sotuvchi"
    users = client.get("/api/v1/crm/users", headers=admin)
    assert users.status_code == 200
    new_user = next(row for row in users.json() if row["id"] == created.json()["id"])

    assert client.post(f"/api/v1/crm/users/{new_user['id']}/deactivate", headers=admin).status_code == 204
    assert client.post(
        "/api/v1/auth/login", data={"username": "yangi.sotuvchi", "password": "Sinov-yangi-2026!"}
    ).status_code == 401
    audit_actions = {row["action"] for row in client.get("/api/v1/crm/audit", headers=admin).json()}
    assert {"user.created", "user.deactivated"} <= audit_actions


def test_audit_is_admin_only_and_public_catalog_is_company_scoped(crm):
    client, ids = crm
    seller = headers(token(client, "sotuvchi.sinov", "Sinov-sotuvchi-2026!"))
    forbidden = client.get("/api/v1/crm/audit", headers=seller)
    assert forbidden.status_code == 403

    complexes = client.get("/api/v1/companies/sinov-qurilish/majmualar")
    assert complexes.status_code == 200
    assert complexes.json()[0]["name"] == "Bog‘ishamol turar joy majmuasi"

    apartments = client.get("/api/v1/companies/sinov-qurilish/kvartiralar")
    assert apartments.status_code == 200
    assert apartments.json()[0]["id"] == ids["apartment"]

    no_consent = client.post(
        "/api/v1/companies/sinov-qurilish/arizalar",
        json={"full_name": "Aziza Sinov", "phone": "+998000000031", "apartment_id": ids["apartment"], "consent": False},
    )
    assert no_consent.status_code == 422
