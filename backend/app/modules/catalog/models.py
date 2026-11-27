from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Column,
    ForeignKeyConstraint,
    UniqueConstraint,
)
from sqlmodel import Field, SQLModel


class Company(SQLModel, table=True):
    __tablename__ = "companies"
    id: int | None = Field(default=None, primary_key=True)
    slug: str = Field(unique=True, max_length=60)
    name: str = Field(max_length=120)


class Complex(SQLModel, table=True):
    __tablename__ = "complexes"
    __table_args__ = (UniqueConstraint("company_id", "id"),)
    id: int | None = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="companies.id", index=True)
    name: str = Field(max_length=120)


class Apartment(SQLModel, table=True):
    __tablename__ = "apartments"
    __table_args__ = (
        UniqueConstraint("company_id", "id"),
        UniqueConstraint("complex_id", "number"),
        ForeignKeyConstraint(
            ["company_id", "complex_id"], ["complexes.company_id", "complexes.id"]
        ),
        CheckConstraint(
            "rooms BETWEEN 1 AND 10 AND price_uzs > 0", name="ck_apartment_values"
        ),
    )
    id: int | None = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="companies.id", index=True)
    complex_id: int = Field(index=True)
    number: str = Field(max_length=30)
    rooms: int
    price_uzs: int = Field(sa_column=Column(BigInteger, nullable=False))
    availability: str = Field(default="available", max_length=20)
