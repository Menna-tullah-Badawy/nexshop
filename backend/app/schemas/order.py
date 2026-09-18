from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from .user import AddressIn


class CartItemIn(BaseModel):
    product_id: int
    qty: int = Field(default=1, ge=1, le=999)
    variant: str | None = None  # e.g. "Size: M"


class CheckoutIn(BaseModel):
    items: list[CartItemIn] = Field(min_length=1)
    address_id: int | None = None
    address: AddressIn | None = None
    governorate_id: int | None = None
    payment_method: str = Field(
        default="cod", pattern="^(cod|stripe|vodafone_cash|instapay|fawry)$"
    )
    promo_code: str | None = None
    notes: str | None = None


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int | None
    name_ar: str
    name_en: str
    image: str | None
    variant: str | None
    price: float
    qty: int
    line_total: float


class PaymentOut(BaseModel):
    provider: str  # cod | stripe | demo
    url: str | None = None
    needs_redirect: bool = False
    demo: bool = False


class OrderOut(BaseModel):
    id: int
    order_no: str
    status: str
    payment_method: str
    payment_status: str
    currency: str
    rate: float
    subtotal: float
    delivery_fee: float
    discount: float
    total: float
    base_total: float
    promo_code: str | None
    customer_name: str
    customer_phone: str
    address: dict | None
    governorate: str | None
    notes: str | None
    courier_name: str | None = None
    courier_phone: str | None = None
    created_at: datetime
    delivered_at: datetime | None
    items: list[OrderItemOut]


class OrderDetailOut(OrderOut):
    payment: PaymentOut | None = None
    base_subtotal: float
    base_delivery: float
    base_discount: float
