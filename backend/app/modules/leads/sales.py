
from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.core.db import SessionDep
from app.modules.auth.routes import WriterDep
from app.modules.catalog.models import Apartment
from app.modules.leads.models import Lead
from app.modules.users.models import Audit
from app.schemas import SaleConfirmRead, SaleConfirmRequest

router = APIRouter(prefix="/api/v1/crm/arizalar", tags=["Sales"])


@router.post("/{lead_id}/sale/confirm", response_model=SaleConfirmRead)
def confirm_sale(
    lead_id: int,
    data: SaleConfirmRequest,
    user: WriterDep,
    session: SessionDep,
) -> SaleConfirmRead:
    """Complete a sale atomically: a viewing lead wins and its apartment sells."""
    lead = session.exec(
        select(Lead)
        .where(Lead.id == lead_id, Lead.company_id == user.company_id)
        .with_for_update()
    ).first()
    if lead is None:
        raise HTTPException(404, "Ariza topilmadi")
    if lead.version != data.expected_version:
        raise HTTPException(409, "Versiya eskirgan; arizani qayta o‘qing")
    if lead.stage != "viewing":
        raise HTTPException(409, "Sotuvni faqat ko‘rik bosqichidagi arizadan yakunlash mumkin")

    apartment = session.exec(
        select(Apartment)
        .where(
            Apartment.id == lead.apartment_id,
            Apartment.company_id == user.company_id,
        )
        .with_for_update()
    ).first()
    if apartment is None:
        raise HTTPException(409, "Arizaga bog‘langan xonadon topilmadi")
    if apartment.availability != "available":
        raise HTTPException(409, "Xonadon sotuvga yaroqli emas; katalogni qayta o‘qing")

    lead.stage = "won"
    lead.version += 1
    apartment.availability = "sold"
    session.add(lead)
    session.add(apartment)
    session.add_all(
        [
            Audit(
                company_id=user.company_id,
                actor_id=user.id,
                action="lead.sale_confirmed",
                resource_id=lead.id,
            ),
            Audit(
                company_id=user.company_id,
                actor_id=user.id,
                action="apartment.sold",
                resource_id=apartment.id,
            ),
        ]
    )
    session.commit()
    session.refresh(lead)
    session.refresh(apartment)
    return SaleConfirmRead(lead=lead, apartment=apartment)
