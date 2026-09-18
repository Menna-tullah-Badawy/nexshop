from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...core.config import get_settings as get_cfg
from ...core.deps import get_db
from ...models import Governorate, SiteSettings
from ...services import currency_list

router = APIRouter(prefix="/meta", tags=["meta"])


@router.get("/brand")
def brand(lang: str = "en", db: Session = Depends(get_db)):
    """Public brand/meta endpoint — the white-label backbone of the frontend."""
    s = db.execute(select(SiteSettings).where(SiteSettings.id == 1)).scalar_one_or_none()
    if s is None:
        s = SiteSettings(id=1)

    zones = db.execute(
        select(Governorate).where(Governorate.active.is_(True)).order_by(Governorate.name_ar)
    ).scalars().all()

    return {
        "store_name": s.store_name,
        "store_name_ar": getattr(s, "store_name", None) or s.store_name,
        "tagline": {"ar": s.tagline_ar, "en": s.tagline_en},
        "logo_url": s.logo_url,
        "primary_color": s.primary_color,
        "theme_preset": s.theme_preset,
        "dark_default": s.dark_default,
        "announcement": {"ar": s.announcement_ar, "en": s.announcement_en},
        "base_currency": s.base_currency,
        "currencies": currency_list(s),
        "delivery": {
            "enabled": s.delivery_enabled,
            "free_delivery_above": float(s.free_delivery_above or 0),
            "zones": [
                {"id": z.id, "name_ar": z.name_ar, "name_en": z.name_en, "fee": float(z.fee)}
                for z in zones
            ],
        },
        "payments": {
            "cod": s.cod_enabled,
            "stripe": s.stripe_enabled or (s.demo_payments and not get_cfg().is_production),
            "demo": s.demo_payments and not get_cfg().is_production,
            "wallet": s.wallet_enabled,
            "wallet_phone": s.wallet_phone,
            "instapay_address": s.instapay_address,
            "fawry": s.fawry_enabled and s.wallet_enabled,
        },
        "whatsapp_number": s.whatsapp_number,
        "environment": get_cfg().env,
        "contact": {
            "phone": s.contact_phone,
            "email": s.contact_email,
            "address": s.contact_address,
        },
        "social": s.social or {},
    }
