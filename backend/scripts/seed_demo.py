"""Seed synthetic Uzbek CRM demo records into an explicitly selected test database."""

from __future__ import annotations

import os
import re
import sys

from sqlalchemy.engine import make_url
from sqlmodel import Session, create_engine, select

from app.core.security import passwords
from app.modules.catalog.models import Apartment, Company, Complex
from app.modules.leads.models import Lead
from app.modules.users.models import Audit, User


def require_test_target() -> tuple[str, dict[str, str]]:
    database_url = os.environ.get("SEED_DATABASE_URL", "")
    if not database_url:
        raise SystemExit("SEED_DATABASE_URL is required; DATABASE_URL is never used by this script.")
    if os.environ.get("SEED_CONFIRM_TEST_DB") != "YES":
        raise SystemExit("Set SEED_CONFIRM_TEST_DB=YES to confirm this is a disposable test database.")
    if os.environ.get("ENVIRONMENT", "").lower() != "test":
        raise SystemExit("Set ENVIRONMENT=test before seeding.")
    try:
        parsed = make_url(database_url)
    except Exception as exc:
        raise SystemExit("SEED_DATABASE_URL is not a valid SQLAlchemy URL.") from exc
    if parsed.drivername != "postgresql+psycopg" or not parsed.database:
        raise SystemExit("Seed target must use PostgreSQL with the psycopg driver.")
    if not re.search(r"(?:^|[-_])test(?:$|[-_])", parsed.database, re.IGNORECASE):
        raise SystemExit("Database name must clearly contain a separate test marker, e.g. crm_test.")

    passwords_by_role = {
        "admin": os.environ.get("SEED_ADMIN_PASSWORD", ""),
        "seller": os.environ.get("SEED_SELLER_PASSWORD", ""),
        "viewer": os.environ.get("SEED_VIEWER_PASSWORD", ""),
    }
    if any(len(value) < 12 for value in passwords_by_role.values()):
        raise SystemExit("Set SEED_ADMIN_PASSWORD, SEED_SELLER_PASSWORD, and SEED_VIEWER_PASSWORD (12+ chars each).")
    return database_url, passwords_by_role


def seed() -> None:
    database_url, demo_passwords = require_test_target()
    engine = create_engine(database_url, pool_pre_ping=True)
    try:
        with Session(engine) as session:
            company = session.exec(select(Company).where(Company.slug == "sinov-qurilish")).first()
            if company is None:
                company = Company(slug="sinov-qurilish", name="Sinov Qurilish")
                session.add(company)
                session.flush()

            users: dict[str, User] = {}
            for role, username in (("admin", "demo-admin"), ("seller", "demo-sotuvchi"), ("viewer", "demo-kuzatuvchi")):
                user = session.exec(select(User).where(User.username == username)).first()
                if user is None:
                    user = User(
                        company_id=company.id,
                        username=username,
                        password_hash=passwords.hash(demo_passwords[role]),
                        role=role,
                    )
                    session.add(user)
                    session.flush()
                users[role] = user

            complex_names = ("Registon maskani", "Bog‘ishamol turar joy majmuasi", "Zarafshon bog‘lari")
            complexes: dict[str, Complex] = {}
            for name in complex_names:
                item = session.exec(select(Complex).where(Complex.company_id == company.id, Complex.name == name)).first()
                if item is None:
                    item = Complex(company_id=company.id, name=name)
                    session.add(item)
                    session.flush()
                complexes[name] = item

            apartments_spec = (
                ("Registon maskani", "A-12", 2, 685_000_000, "available"),
                ("Registon maskani", "A-18", 3, 895_000_000, "available"),
                ("Bog‘ishamol turar joy majmuasi", "B-07", 1, 472_000_000, "reserved"),
                ("Bog‘ishamol turar joy majmuasi", "B-21", 3, 925_000_000, "available"),
                ("Zarafshon bog‘lari", "C-04", 2, 738_000_000, "sold"),
                ("Zarafshon bog‘lari", "C-16", 4, 1_160_000_000, "available"),
            )
            apartments: dict[str, Apartment] = {}
            for complex_name, number, rooms, price, availability in apartments_spec:
                item = session.exec(select(Apartment).where(Apartment.complex_id == complexes[complex_name].id, Apartment.number == number)).first()
                if item is None:
                    item = Apartment(company_id=company.id, complex_id=complexes[complex_name].id, number=number, rooms=rooms, price_uzs=price, availability=availability)
                    session.add(item)
                    session.flush()
                apartments[number] = item

            leads_spec = (
                ("Dilshod Karimov", "+998000000101", "A-12", "new"),
                ("Madina Rahimova", "+998000000102", "A-18", "contacted"),
                ("Jasur Ergashev", "+998000000103", "B-07", "viewing"),
                ("Nodira Sobirova", "+998000000104", "C-04", "won"),
                ("Sardor Ismoilov", "+998000000105", "B-21", "lost"),
            )
            for full_name, phone, apartment_number, stage in leads_spec:
                exists = session.exec(select(Lead).where(Lead.company_id == company.id, Lead.phone == phone)).first()
                if exists is None:
                    session.add(Lead(company_id=company.id, apartment_id=apartments[apartment_number].id, full_name=full_name, phone=phone, stage=stage, source="demo"))

            audit_exists = session.exec(select(Audit).where(Audit.company_id == company.id, Audit.action == "demo.seeded")).first()
            if audit_exists is None:
                session.add(Audit(company_id=company.id, actor_id=users["admin"].id, action="demo.seeded", resource_id=company.id))
            session.commit()
    finally:
        engine.dispose()

    print("Demo seed complete: Sinov Qurilish, 3 users, Uzbek complexes, apartments, leads and audit record.")
    print("Logins: demo-admin, demo-sotuvchi, demo-kuzatuvchi. Passwords are the provided SEED_* values.")


if __name__ == "__main__":
    try:
        seed()
    except Exception as exc:
        print(f"Seed failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        raise
