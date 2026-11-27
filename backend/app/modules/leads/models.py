from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKeyConstraint,
    UniqueConstraint,
)
from sqlmodel import Field, SQLModel

from app.core.time import now


class Lead(SQLModel, table=True):
    __tablename__ = "leads"
    __table_args__ = (
        UniqueConstraint("company_id", "id"),
        ForeignKeyConstraint(
            ["company_id", "apartment_id"], ["apartments.company_id", "apartments.id"]
        ),
        CheckConstraint(
            "stage IN ('new','contacted','viewing','won','lost')", name="ck_lead_stage"
        ),
    )
    id: int | None = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="companies.id", index=True)
    apartment_id: int = Field(index=True)
    full_name: str = Field(max_length=80)
    phone: str = Field(max_length=13)
    stage: str = Field(default="new", max_length=20)
    source: str = Field(default="web", max_length=30)
    version: int = 1
    consent_at: datetime = Field(
        default_factory=now, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
