from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_no: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    # Delivery pipeline: pending -> confirmed -> packing -> out_for_delivery -> delivered
    # plus cancelled
    status: Mapped[str] = mapped_column(String(24), default="pending", index=True)
    payment_method: Mapped[str] = mapped_column(String(24), default="cod")  # cod|stripe|vodafone_cash|instapay|fawry
    payment_status: Mapped[str] = mapped_column(String(16), default="pending")  # pending|paid|refunded|failed
    # Reference code shown to the customer for wallet / Fawry transfers
    payment_reference: Mapped[str | None] = mapped_column(String(64))

    # Currency snapshot at order time
    currency: Mapped[str] = mapped_column(String(16))  # display currency of the buyer
    rate: Mapped[float] = mapped_column(Numeric(12, 6), default=1)  # 1 base unit = rate display units

    # Amounts in display currency (for the buyer's receipts)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    delivery_fee: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    discount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    total: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    # Amounts in base currency (store accounting)
    base_subtotal: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    base_delivery: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    base_discount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    base_total: Mapped[float] = mapped_column(Numeric(12, 2), default=0)

    promo_code: Mapped[str | None] = mapped_column(String(64))
    customer_name: Mapped[str] = mapped_column(String(255), default="")
    customer_phone: Mapped[str] = mapped_column(String(32), default="")
    address: Mapped[dict | None] = mapped_column(JSON)  # snapshot {label, full_name, phone, city, street, notes}
    governorate: Mapped[str | None] = mapped_column(String(128))  # snapshot name
    notes: Mapped[str | None] = mapped_column(Text)

    # Delivery crew (set from the delivery dashboard)
    courier_name: Mapped[str | None] = mapped_column(String(128))
    courier_phone: Mapped[str | None] = mapped_column(String(32))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    items: Mapped[list[OrderItem]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )
    user: Mapped[User] = relationship(back_populates="orders")  # noqa: F821


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), index=True
    )
    name_ar: Mapped[str] = mapped_column(String(255), default="")
    name_en: Mapped[str] = mapped_column(String(255), default="")
    image: Mapped[str | None] = mapped_column(String(1024))
    variant: Mapped[str | None] = mapped_column(String(128))
    price: Mapped[float] = mapped_column(Numeric(12, 2))  # base currency unit price
    qty: Mapped[int] = mapped_column(Integer, default=1)
    line_total: Mapped[float] = mapped_column(Numeric(12, 2))  # base currency

    order: Mapped[Order] = relationship(back_populates="items")
