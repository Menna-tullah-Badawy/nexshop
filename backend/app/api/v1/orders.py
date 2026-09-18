from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...core.deps import get_current_user, get_db
from ...models import Order, OrderItem, Product, User
from ...schemas import CheckoutIn, Msg
from ...services import (
    PaymentsService,
    compute_lines,
    convert,
    get_settings_row,
    new_order_no,
    q2,
    rates_map,
    resolve_address,
    resolve_governorate,
)
from .serializers import order_dict

router = APIRouter(prefix="/orders", tags=["orders"])


def _get_order(db: Session, key: str) -> Order:
    if key.isdigit():
        o = db.get(Order, int(key))
    else:
        o = db.execute(select(Order).where(Order.order_no == key)).scalar_one_or_none()
    if o is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return o


@router.post("", status_code=201, response_model=dict)
def create_order(body: CheckoutIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = get_settings_row(db)

    if body.payment_method == "cod" and not settings.cod_enabled:
        raise HTTPException(status_code=400, detail="Cash on delivery is not enabled")
    if body.payment_method == "stripe" and not (settings.stripe_enabled or settings.demo_payments):
        raise HTTPException(status_code=400, detail="Card payment is not enabled")

    lines, base_subtotal, base_delivery, base_discount, promo = compute_lines(db, body, settings)
    snapshot = resolve_address(db, user, body)
    gov = resolve_governorate(db, body.governorate_id)

    base = settings.base_currency
    currency = user.currency or base
    rates = rates_map(settings)
    rate = rates.get(currency)
    if not rate or rate == 0:
        currency, rate = base, Decimal("1")
    if currency == base:
        rate = Decimal("1")

    base_total = base_subtotal - base_discount + base_delivery

    order = Order(
        order_no=new_order_no(),
        user_id=user.id,
        status="pending",
        payment_method=body.payment_method,
        payment_status="pending",
        currency=currency,
        rate=float(rate),
        subtotal=float(convert(base_subtotal, base, currency, settings)),
        delivery_fee=float(convert(base_delivery, base, currency, settings)),
        discount=float(convert(base_discount, base, currency, settings)),
        total=float(convert(base_total, base, currency, settings)),
        base_subtotal=float(base_subtotal),
        base_delivery=float(base_delivery),
        base_discount=float(base_discount),
        base_total=float(base_total),
        promo_code=promo.code if promo else None,
        customer_name=snapshot["full_name"],
        customer_phone=snapshot["phone"],
        address=snapshot,
        governorate=(gov.name_ar if gov else None),
        notes=body.notes,
    )
    db.add(order)
    db.flush()

    for p, line in lines:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=p.id,
                name_ar=p.name_ar,
                name_en=p.name_en,
                image=(p.images or [None])[0],
                variant=line.variant,
                price=float(p.price),
                qty=line.qty,
                line_total=float(q2(p.price) * line.qty),
            )
        )
        p.stock -= line.qty

    result = PaymentsService(settings).start_payment(order)
    db.commit()
    db.refresh(order)
    return {
        "order": order_dict(order),
        "payment": {
            "provider": result.provider,
            "url": result.url,
            "needs_redirect": result.needs_redirect,
            "demo": result.demo,
        },
    }


@router.get("", response_model=list[dict])
def my_orders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.execute(
        select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc(), Order.id.desc())
    ).scalars().all()
    return [order_dict(o) for o in rows]


@router.get("/{key}", response_model=dict)
def get_order(key: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    o = _get_order(db, key)
    if o.user_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your order")
    return order_dict(o)


@router.post("/{key}/cancel", response_model=dict)
def cancel_order(key: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    o = _get_order(db, key)
    if o.user_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your order")
    if o.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending orders can be cancelled")
    if o.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Paid orders cannot be cancelled here — contact support")
    o.status = "cancelled"
    for it in o.items:
        if it.product_id:
            p = db.get(Product, it.product_id)
            if p:
                p.stock += it.qty
    db.commit()
    db.refresh(o)
    return order_dict(o)


@router.get("/{key}/payment", response_model=dict)
def payment_status(key: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    o = _get_order(db, key)
    if o.user_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your order")
    return {
        "order_no": o.order_no,
        "payment_status": o.payment_status,
        "paid": o.payment_status == "paid",
        "status": o.status,
    }
