"""Helpers for order management (totals, stock, status flow)."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Governorate, Promo, Product, SiteSettings
from ..schemas.order import CheckoutIn
from .currency import q2

ORDER_FLOW = ["pending", "confirmed", "packing", "out_for_delivery", "delivered"]
VALID_STATUSES = set(ORDER_FLOW) | {"cancelled"}


def new_order_no() -> str:
    now = datetime.now(timezone.utc)
    return f"NX{now.strftime('%Y%m%d%H%M%S')}{now.microsecond % 1000:03d}"


def get_settings_row(db: Session) -> SiteSettings:
    s = db.execute(select(SiteSettings).where(SiteSettings.id == 1)).scalar_one_or_none()
    if s is None:
        s = SiteSettings(id=1)
        db.add(s)
        db.flush()
    return s


def next_status(current: str) -> str | None:
    try:
        i = ORDER_FLOW.index(current)
    except ValueError:
        return None
    return ORDER_FLOW[i + 1] if i + 1 < len(ORDER_FLOW) else None


def resolve_governorate(db: Session, governorate_id: int | None) -> Governorate | None:
    if not governorate_id:
        return None
    gov = db.get(Governorate, governorate_id)
    if gov is None or not gov.active:
        raise HTTPException(status_code=400, detail="Unknown governorate")
    return gov


def resolve_address(db: Session, user, body: CheckoutIn) -> dict:
    if body.address_id:
        addr = next((a for a in user.addresses if a.id == body.address_id), None)
        if addr is None:
            raise HTTPException(status_code=400, detail="Unknown address")
        snapshot = {
            "label": addr.label, "full_name": addr.full_name, "phone": addr.phone,
            "city": addr.city, "street": addr.street, "notes": addr.notes,
        }
    elif body.address:
        a = body.address
        snapshot = {
            "label": a.label, "full_name": a.full_name, "phone": a.phone,
            "city": a.city, "street": a.street, "notes": a.notes,
        }
    else:
        raise HTTPException(status_code=400, detail="Address is required")

    if not snapshot.get("full_name") or not snapshot.get("phone"):
        raise HTTPException(status_code=400, detail="Address needs full name and phone")
    return snapshot


def _aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def apply_promo(db: Session, code: str | None, subtotal_base) -> Promo | None:
    if not code:
        return None
    promo = db.execute(select(Promo).where(Promo.code == code.strip().upper())).scalar_one_or_none()
    if promo is None or not promo.active:
        raise HTTPException(status_code=400, detail="Invalid promo code")
    expires = _aware(promo.expires_at)
    if expires and expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Promo expired")
    if subtotal_base < float(promo.min_order):
        raise HTTPException(status_code=400, detail="Promo minimum order not reached")
    return promo


def compute_lines(db: Session, body: CheckoutIn, settings: SiteSettings):
    """Validate items & governorate, compute base-currency totals.

    Returns (lines, base_subtotal, base_delivery, base_discount, promo).
    """
    lines = []
    subtotal = q2(0)
    for line in body.items:
        p = db.get(Product, line.product_id)
        if p is None or not p.is_active:
            raise HTTPException(status_code=400, detail=f"Product {line.product_id} unavailable")
        if p.stock < line.qty:
            raise HTTPException(status_code=409, detail=f"Out of stock: {p.name_en or p.name_ar}")
        lines.append((p, line))
        subtotal += q2(p.price) * line.qty

    gov = resolve_governorate(db, body.governorate_id)
    threshold = float(settings.free_delivery_above or 0)
    if gov and settings.delivery_enabled:
        # free delivery above the threshold (base currency)
        delivery = q2(0) if subtotal >= q2(threshold) and threshold > 0 else q2(gov.fee)
    else:
        delivery = q2(0)

    promo = apply_promo(db, body.promo_code, subtotal)
    discount = q2(0)
    if promo is not None:
        if promo.type == "percent":
            discount = q2(subtotal * Decimal(str(promo.value)) / Decimal(100))
        else:
            discount = min(q2(promo.value), subtotal)

    return lines, subtotal, delivery, discount, promo
