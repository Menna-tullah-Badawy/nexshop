from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from ..db.base import Base


class Governorate(Base):
    __tablename__ = "governorates"

    id: Mapped[int] = mapped_column(primary_key=True)
    name_ar: Mapped[str] = mapped_column(String(128), default="")
    name_en: Mapped[str] = mapped_column(String(128), default="")
    fee: Mapped[float] = mapped_column(Numeric(12, 2), default=0)  # base currency
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Promo(Base):
    __tablename__ = "promos"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    type: Mapped[str] = mapped_column(String(12))  # percent | fixed
    value: Mapped[float] = mapped_column(Numeric(12, 2))
    min_order: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class SiteSettings(Base):
    """Single-row table holding all white-label / store configuration."""

    __tablename__ = "site_settings"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)

    # Brand
    store_name: Mapped[str] = mapped_column(String(255), default="NexShop")
    tagline_ar: Mapped[str] = mapped_column(String(512), default="")
    tagline_en: Mapped[str] = mapped_column(String(512), default="")
    logo_url: Mapped[str | None] = mapped_column(String(1024))
    primary_color: Mapped[str] = mapped_column(String(16), default="#6C4DF6")
    theme_preset: Mapped[str] = mapped_column(String(24), default="aurora")
    dark_default: Mapped[bool] = mapped_column(Boolean, default=False)
    announcement_ar: Mapped[str] = mapped_column(String(512), default="")
    announcement_en: Mapped[str] = mapped_column(String(512), default="")

    # Money
    base_currency: Mapped[str] = mapped_column(String(16), default="EGP")
    # [{code, rate, enabled}] where rate = units of `code` per 1 base unit
    currencies: Mapped[list] = mapped_column(JSON, default=list)

    # Logistics
    delivery_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    # Base-currency threshold above which delivery is free (0 = disabled)
    free_delivery_above: Mapped[float] = mapped_column(Numeric(12, 2), default=0)

    # Payments
    cod_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    stripe_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    stripe_secret_key: Mapped[str | None] = mapped_column(String(512))
    demo_payments: Mapped[bool] = mapped_column(Boolean, default=True)

    # Contact
    contact_phone: Mapped[str | None] = mapped_column(String(32))
    contact_email: Mapped[str | None] = mapped_column(String(255))
    contact_address: Mapped[str | None] = mapped_column(String(512))
    social: Mapped[dict] = mapped_column(JSON, default=dict)

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )
