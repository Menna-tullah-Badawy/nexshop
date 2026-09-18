from datetime import date, datetime

from pydantic import BaseModel, Field

from .catalog import ProductIn, ProductOut
from .common import Msg


class DashboardOut(BaseModel):
    today_revenue: float
    today_orders: int
    month_revenue: float
    month_orders: int
    total_customers: int
    total_products: int
    status_counts: dict[str, int]
    pending_delivery: int
    low_stock: list[dict]
    top_products: list[dict]
    recent_orders: list[dict]
    last_14_days: list[dict]  # [{date, revenue, orders}]


class CategoryIn(BaseModel):
    slug: str | None = None
    name_ar: str = ""
    name_en: str = ""
    desc_ar: str | None = None
    desc_en: str | None = None
    image_url: str | None = None
    is_active: bool = True
    sort_order: int = 0


class PromoIn(BaseModel):
    code: str = Field(min_length=3, max_length=64)
    type: str = Field(pattern="^(percent|fixed)$")
    value: float = Field(gt=0)
    min_order: float = Field(default=0, ge=0)
    active: bool = True
    expires_at: datetime | None = None


class GovernorateIn(BaseModel):
    name_ar: str = ""
    name_en: str = ""
    fee: float = Field(ge=0)
    active: bool = True


class GovernorateUpdate(BaseModel):
    name_ar: str | None = None
    name_en: str | None = None
    fee: float | None = Field(default=None, ge=0)
    active: bool | None = None


class RateIn(BaseModel):
    code: str = Field(min_length=3, max_length=8)
    rate: float = Field(gt=0)
    enabled: bool = True


class SettingsUpdate(BaseModel):
    # Brand
    store_name: str | None = None
    tagline_ar: str | None = None
    tagline_en: str | None = None
    logo_url: str | None = None
    primary_color: str | None = None
    theme_preset: str | None = None
    dark_default: bool | None = None
    announcement_ar: str | None = None
    announcement_en: str | None = None
    # Money
    base_currency: str | None = None
    currencies: list[RateIn] | None = None
    # Logistics / payments
    delivery_enabled: bool | None = None
    free_delivery_above: float | None = Field(default=None, ge=0)
    cod_enabled: bool | None = None
    stripe_enabled: bool | None = None
    stripe_secret_key: str | None = None
    demo_payments: bool | None = None
    wallet_enabled: bool | None = None
    wallet_phone: str | None = None
    instapay_address: str | None = None
    fawry_enabled: bool | None = None
    whatsapp_number: str | None = None
    # Inventory
    low_stock_threshold: int | None = Field(default=None, ge=0)
    # Contact
    contact_phone: str | None = None
    contact_email: str | None = None
    contact_address: str | None = None
    social: dict | None = None


class OrderStatusUpdate(BaseModel):
    status: str = Field(pattern="^(pending|confirmed|packing|out_for_delivery|delivered|cancelled)$")


class OrderMetaUpdate(BaseModel):
    courier_name: str | None = None
    courier_phone: str | None = None
    notes: str | None = None


class CustomerUpdate(BaseModel):
    is_active: bool | None = None
    role: str | None = Field(default=None, pattern="^(customer|admin)$")
    currency: str | None = None


class OrdersFilter(BaseModel):
    status: str | None = None
    payment_status: str | None = None
    q: str | None = None
    date_from: date | None = None
    date_to: date | None = None
    page: int = 1
    limit: int = 20
