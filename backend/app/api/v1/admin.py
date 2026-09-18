"""Admin dashboard API — full store management (white-label backbone)."""

from __future__ import annotations

import csv
import io
from datetime import datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ...core.deps import get_current_admin, get_db
from ...models import (
    Category,
    Governorate,
    Order,
    OrderItem,
    Product,
    Promo,
    SiteSettings,
    User,
)
from ...schemas import (
    CategoryIn,
    CustomerUpdate,
    DashboardOut,
    GovernorateIn,
    GovernorateUpdate,
    Msg,
    OrderMetaUpdate,
    OrderStatusUpdate,
    Page,
    ProductIn,
    PromoIn,
    RateIn,
    SettingsUpdate,
    slugify,
)
from ...services import (
    CURRENCY_INFO,
    get_settings_row,
    next_status,
    q2,
)
from .serializers import order_dict, product_dict, settings_dict

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])

ORDER_FLOW = ["pending", "confirmed", "packing", "out_for_delivery", "delivered"]


def _paginate(stmt, db, page: int, limit: int):
    total = db.execute(select(func.count()).select_from(stmt.order_by(None).subquery())).scalar_one()
    rows = db.execute(stmt.offset((page - 1) * limit).limit(limit)).scalars().all()
    return rows, total


# ------------------------------ Dashboard ------------------------------ #

@router.get("/dashboard", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today_start = datetime.combine(now.date(), time.min, tzinfo=timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

    def money(start: datetime) -> tuple[float, int]:
        row = db.execute(
            select(func.coalesce(func.sum(Order.base_total), 0), func.count(Order.id)).where(
                Order.created_at >= start, Order.status != "cancelled"
            )
        ).one()
        return float(row[0] or 0), int(row[1] or 0)

    today_revenue, today_orders = money(today_start)
    month_revenue, month_orders = money(month_start)

    status_rows = db.execute(select(Order.status, func.count(Order.id)).group_by(Order.status)).all()
    status_counts = {s: int(c) for s, c in status_rows}
    pending_delivery = status_counts.get("packing", 0) + status_counts.get("out_for_delivery", 0)

    low_stock = db.execute(
        select(Product)
        .where(Product.is_active.is_(True), Product.stock <= 5)
        .order_by(Product.stock.asc())
        .limit(5)
    ).scalars().all()

    since_30 = now - timedelta(days=30)
    top_rows = db.execute(
        select(OrderItem.name_en, OrderItem.name_ar, func.sum(OrderItem.qty), func.sum(OrderItem.line_total))
        .join(Order, OrderItem.order_id == Order.id)
        .where(Order.created_at >= since_30, Order.status != "cancelled")
        .group_by(OrderItem.name_en, OrderItem.name_ar)
        .order_by(func.sum(OrderItem.qty).desc())
        .limit(5)
    ).all()

    recent = db.execute(
        select(Order).order_by(Order.created_at.desc(), Order.id.desc()).limit(8)
    ).scalars().all()

    last_14 = []
    for i in range(13, -1, -1):
        day_start = datetime.combine((now - timedelta(days=i)).date(), time.min, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        rev, cnt = db.execute(
            select(func.coalesce(func.sum(Order.base_total), 0), func.count(Order.id)).where(
                Order.created_at >= day_start,
                Order.created_at < day_end,
                Order.status != "cancelled",
            )
        ).one()
        last_14.append(
            {"date": day_start.strftime("%Y-%m-%d"), "revenue": float(rev or 0), "orders": int(cnt or 0)}
        )

    total_customers = db.execute(select(func.count(User.id)).where(User.role == "customer")).scalar_one()
    total_products = db.execute(select(func.count(Product.id)).where(Product.is_active.is_(True))).scalar_one()

    return DashboardOut(
        today_revenue=today_revenue,
        today_orders=today_orders,
        month_revenue=month_revenue,
        month_orders=month_orders,
        total_customers=total_customers,
        total_products=total_products,
        status_counts=status_counts,
        pending_delivery=pending_delivery,
        low_stock=[{"id": p.id, "name": p.name_en or p.name_ar, "stock": p.stock} for p in low_stock],
        top_products=[
            {"name": r[0] or r[1] or "Item", "qty": int(r[2] or 0), "revenue": float(r[3] or 0)} for r in top_rows
        ],
        recent_orders=[
            {
                "id": o.id,
                "order_no": o.order_no,
                "status": o.status,
                "payment_status": o.payment_status,
                "payment_method": o.payment_method,
                "total": float(o.total),
                "base_total": float(o.base_total),
                "currency": o.currency,
                "customer_name": o.customer_name,
                "created_at": o.created_at,
            }
            for o in recent
        ],
        last_14_days=last_14,
    )


# ------------------------------ Products ------------------------------ #

@router.get("/products", response_model=Page[dict])
def admin_products(
    search: str | None = None,
    category_id: int | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = select(Product)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(or_(Product.name_ar.ilike(like), Product.name_en.ilike(like), Product.slug.ilike(like)))
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)
    stmt = stmt.order_by(Product.created_at.desc(), Product.id.desc())
    rows, total = _paginate(stmt, db, page, limit)
    return Page(items=[product_dict(p, include_cost=True) for p in rows], total=total, page=page, limit=limit, pages=max(1, -(-total // limit)))


def _ensure_slug(db: Session, base_slug: str, exclude_id: int | None = None) -> str:
    slug = base_slug
    i = 2
    while True:
        stmt = select(Product).where(Product.slug == slug)
        if exclude_id:
            stmt = stmt.where(Product.id != exclude_id)
        if db.execute(stmt).scalar_one_or_none() is None:
            return slug
        slug = f"{base_slug}-{i}"
        i += 1


@router.post("/products", status_code=201, response_model=dict)
def create_product(body: ProductIn, db: Session = Depends(get_db)):
    if not body.name_ar and not body.name_en:
        raise HTTPException(status_code=400, detail="Product needs a name")
    slug = _ensure_slug(db, slugify(body.slug or body.name_en or body.name_ar))
    p = Product(slug=slug, **body.model_dump(exclude={"slug"}))
    db.add(p)
    db.commit()
    db.refresh(p)
    return product_dict(p, include_cost=True)


@router.get("/products/{pid}", response_model=dict)
def get_product(pid: int, db: Session = Depends(get_db)):
    p = db.get(Product, pid)
    if p is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_dict(p, include_cost=True)


@router.put("/products/{pid}", response_model=dict)
def update_product(pid: int, body: ProductIn, db: Session = Depends(get_db)):
    p = db.get(Product, pid)
    if p is None:
        raise HTTPException(status_code=404, detail="Product not found")
    data = body.model_dump(exclude={"slug"})
    for k, v in data.items():
        setattr(p, k, v)
    if body.slug:
        p.slug = _ensure_slug(db, slugify(body.slug), exclude_id=pid)
    db.commit()
    db.refresh(p)
    return product_dict(p, include_cost=True)


@router.delete("/products/{pid}", response_model=Msg)
def delete_product(pid: int, db: Session = Depends(get_db)):
    p = db.get(Product, pid)
    if p is None:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(p)
    db.commit()
    return Msg(detail="Product deleted")


@router.post("/products/{pid}/toggle", response_model=dict)
def toggle_product(pid: int, db: Session = Depends(get_db)):
    p = db.get(Product, pid)
    if p is None:
        raise HTTPException(status_code=404, detail="Product not found")
    p.is_active = not p.is_active
    db.commit()
    db.refresh(p)
    return product_dict(p, include_cost=True)


# ------------------------------ Categories ------------------------------ #

@router.get("/categories", response_model=list[dict])
def admin_categories(db: Session = Depends(get_db)):
    cats = db.execute(select(Category).order_by(Category.sort_order, Category.id)).scalars().all()
    return [
        {
            "id": c.id, "slug": c.slug, "name_ar": c.name_ar, "name_en": c.name_en,
            "desc_ar": c.desc_ar, "desc_en": c.desc_en, "image_url": c.image_url,
            "is_active": c.is_active, "sort_order": c.sort_order,
        }
        for c in cats
    ]


@router.post("/categories", status_code=201, response_model=dict)
def create_category(body: CategoryIn, db: Session = Depends(get_db)):
    slug = slugify(body.slug or body.name_en or body.name_ar or f"cat-{datetime.now(timezone.utc).timestamp()}")
    if db.execute(select(Category).where(Category.slug == slug)).scalar_one_or_none():
        slug = f"{slug}-{datetime.now(timezone.utc).strftime('%H%M%S')}"
    c = Category(slug=slug, **body.model_dump(exclude={"slug"}))
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"id": c.id, "slug": c.slug, "name_ar": c.name_ar, "name_en": c.name_en, "is_active": c.is_active}


@router.put("/categories/{cid}", response_model=dict)
def update_category(cid: int, body: CategoryIn, db: Session = Depends(get_db)):
    c = db.get(Category, cid)
    if c is None:
        raise HTTPException(status_code=404, detail="Category not found")
    for k, v in body.model_dump(exclude={"slug"}).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return {"id": c.id, "slug": c.slug, "name_ar": c.name_ar, "name_en": c.name_en, "is_active": c.is_active}


@router.delete("/categories/{cid}", response_model=Msg)
def delete_category(cid: int, db: Session = Depends(get_db)):
    c = db.get(Category, cid)
    if c is None:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(c)
    db.commit()
    return Msg(detail="Category deleted")


# ------------------------------ Promos ------------------------------ #

@router.get("/promos", response_model=list[dict])
def admin_promos(db: Session = Depends(get_db)):
    rows = db.execute(select(Promo).order_by(Promo.id.desc())).scalars().all()
    return [
        {"id": p.id, "code": p.code, "type": p.type, "value": float(p.value),
         "min_order": float(p.min_order), "active": p.active, "expires_at": p.expires_at}
        for p in rows
    ]


@router.post("/promos", status_code=201, response_model=dict)
def create_promo(body: PromoIn, db: Session = Depends(get_db)):
    code = body.code.strip().upper()
    if db.execute(select(Promo).where(Promo.code == code)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Promo code exists")
    p = Promo(code=code, **body.model_dump(exclude={"code"}))
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"id": p.id, "code": p.code, "type": p.type, "value": float(p.value), "active": p.active}


@router.put("/promos/{pid}", response_model=dict)
def update_promo(pid: int, body: PromoIn, db: Session = Depends(get_db)):
    p = db.get(Promo, pid)
    if p is None:
        raise HTTPException(status_code=404, detail="Promo not found")
    data = body.model_dump(exclude={"code"})
    for k, v in data.items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return {"id": p.id, "code": p.code, "type": p.type, "value": float(p.value), "active": p.active}


@router.delete("/promos/{pid}", response_model=Msg)
def delete_promo(pid: int, db: Session = Depends(get_db)):
    p = db.get(Promo, pid)
    if p is None:
        raise HTTPException(status_code=404, detail="Promo not found")
    db.delete(p)
    db.commit()
    return Msg(detail="Promo deleted")


# ------------------------------ Orders ------------------------------ #

@router.get("/orders", response_model=Page[dict])
def admin_orders(
    status: str | None = None,
    payment_status: str | None = None,
    q: str | None = None,
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = select(Order)
    if status:
        stmt = stmt.where(Order.status == status)
    if payment_status:
        stmt = stmt.where(Order.payment_status == payment_status)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Order.order_no.ilike(like), Order.customer_name.ilike(like), Order.customer_phone.ilike(like)))
    if date_from:
        try:
            stmt = stmt.where(Order.created_at >= datetime.fromisoformat(date_from).replace(tzinfo=timezone.utc))
        except ValueError:
            pass
    if date_to:
        try:
            stmt = stmt.where(Order.created_at < datetime.fromisoformat(date_to).replace(tzinfo=timezone.utc))
        except ValueError:
            pass
    stmt = stmt.order_by(Order.created_at.desc(), Order.id.desc())
    rows, total = _paginate(stmt, db, page, limit)
    return Page(items=[order_dict(o) for o in rows], total=total, page=page, limit=limit, pages=max(1, -(-total // limit)))


@router.get("/orders/export")
def export_orders(status: str | None = None, db: Session = Depends(get_db)):
    stmt = select(Order).order_by(Order.created_at.desc())
    if status:
        stmt = stmt.where(Order.status == status)
    rows = db.execute(stmt).scalars().all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["order_no", "created_at", "customer", "phone", "governorate", "status",
                "payment_method", "payment_status", "currency", "total", "base_currency_total", "items"])
    for o in rows:
        w.writerow([
            o.order_no, o.created_at.isoformat(), o.customer_name, o.customer_phone,
            o.governorate or "", o.status, o.payment_method, o.payment_status,
            o.currency, f"{float(o.total):.2f}", f"{float(o.base_total):.2f}",
            "; ".join(f"{it.name_en or it.name_ar} x{it.qty}" for it in o.items),
        ])
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders.csv"},
    )


@router.get("/orders/{oid}", response_model=dict)
def admin_order(oid: int, db: Session = Depends(get_db)):
    o = db.get(Order, oid)
    if o is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order_dict(o)


@router.patch("/orders/{oid}", response_model=dict)
def update_order(oid: int, body: OrderStatusUpdate | OrderMetaUpdate, db: Session = Depends(get_db)):
    o = db.get(Order, oid)
    if o is None:
        raise HTTPException(status_code=404, detail="Order not found")
    data = body.model_dump(exclude_unset=True)
    if "status" in data:
        new_status = data["status"]
        if new_status not in ORDER_FLOW + ["cancelled"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        o.status = new_status
        if new_status == "delivered":
            o.delivered_at = datetime.now(timezone.utc)
            if o.payment_method == "cod" and o.payment_status != "paid":
                o.payment_status = "paid"
        if new_status == "cancelled" and o.status != "cancelled":
            for it in o.items:
                if it.product_id:
                    p = db.get(Product, it.product_id)
                    if p:
                        p.stock += it.qty
    for field in ("courier_name", "courier_phone", "notes"):
        if field in data:
            setattr(o, field, data[field])
    db.commit()
    db.refresh(o)
    return order_dict(o)


@router.post("/orders/{oid}/next", response_model=dict)
def advance_order(oid: int, db: Session = Depends(get_db)):
    o = db.get(Order, oid)
    if o is None:
        raise HTTPException(status_code=404, detail="Order not found")
    nxt = next_status(o.status)
    if nxt is None:
        raise HTTPException(status_code=400, detail="No next status")
    o.status = nxt
    if nxt == "delivered":
        o.delivered_at = datetime.now(timezone.utc)
        if o.payment_method == "cod" and o.payment_status != "paid":
            o.payment_status = "paid"
    db.commit()
    db.refresh(o)
    return order_dict(o)


@router.post("/orders/{oid}/mark-paid", response_model=dict)
def mark_paid(oid: int, db: Session = Depends(get_db)):
    o = db.get(Order, oid)
    if o is None:
        raise HTTPException(status_code=404, detail="Order not found")
    o.payment_status = "paid"
    db.commit()
    db.refresh(o)
    return order_dict(o)


# ------------------------------ Customers ------------------------------ #

@router.get("/customers", response_model=Page[dict])
def admin_customers(
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = select(User).where(User.role == "customer")
    if search:
        like = f"%{search}%"
        stmt = stmt.where(or_(User.email.ilike(like), User.full_name.ilike(like), User.phone.ilike(like)))
    stmt = stmt.order_by(User.created_at.desc(), User.id.desc())
    rows, total = _paginate(stmt, db, page, limit)

    items = []
    for u in rows:
        stats = db.execute(
            select(func.count(Order.id), func.coalesce(func.sum(Order.base_total), 0)).where(
                Order.user_id == u.id, Order.status != "cancelled"
            )
        ).one()
        items.append(
            {
                "id": u.id, "email": u.email, "full_name": u.full_name, "phone": u.phone,
                "currency": u.currency, "is_active": u.is_active, "created_at": u.created_at,
                "orders_count": int(stats[0] or 0), "total_spent": float(stats[1] or 0),
            }
        )
    return Page(items=items, total=total, page=page, limit=limit, pages=max(1, -(-total // limit)))


@router.patch("/customers/{uid}", response_model=dict)
def update_customer(uid: int, body: CustomerUpdate, db: Session = Depends(get_db)):
    u = db.get(User, uid)
    if u is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(u, k, v)
    db.commit()
    db.refresh(u)
    return {
        "id": u.id, "email": u.email, "full_name": u.full_name, "phone": u.phone,
        "role": u.role, "currency": u.currency, "is_active": u.is_active,
    }


# ------------------------------ Governorates ------------------------------ #

@router.get("/governorates", response_model=list[dict])
def admin_governorates(db: Session = Depends(get_db)):
    rows = db.execute(select(Governorate).order_by(Governorate.name_ar)).scalars().all()
    return [{"id": g.id, "name_ar": g.name_ar, "name_en": g.name_en, "fee": float(g.fee), "active": g.active} for g in rows]


@router.post("/governorates", status_code=201, response_model=dict)
def create_governorate(body: GovernorateIn, db: Session = Depends(get_db)):
    g = Governorate(**body.model_dump())
    db.add(g)
    db.commit()
    db.refresh(g)
    return {"id": g.id, "name_ar": g.name_ar, "name_en": g.name_en, "fee": float(g.fee), "active": g.active}


@router.put("/governorates/{gid}", response_model=dict)
def update_governorate(gid: int, body: GovernorateUpdate, db: Session = Depends(get_db)):
    g = db.get(Governorate, gid)
    if g is None:
        raise HTTPException(status_code=404, detail="Governorate not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(g, k, v)
    db.commit()
    db.refresh(g)
    return {"id": g.id, "name_ar": g.name_ar, "name_en": g.name_en, "fee": float(g.fee), "active": g.active}


@router.delete("/governorates/{gid}", response_model=Msg)
def delete_governorate(gid: int, db: Session = Depends(get_db)):
    g = db.get(Governorate, gid)
    if g is None:
        raise HTTPException(status_code=404, detail="Governorate not found")
    db.delete(g)
    db.commit()
    return Msg(detail="Governorate deleted")


# ------------------------------ Settings (white-label) ------------------------------ #

@router.get("/settings", response_model=dict)
def get_settings(db: Session = Depends(get_db)):
    return settings_dict(get_settings_row(db))


@router.put("/settings", response_model=dict)
def put_settings(body: SettingsUpdate, db: Session = Depends(get_db)):
    s = get_settings_row(db)
    data = body.model_dump(exclude_unset=True)

    if "currencies" in data and data["currencies"] is not None:
        cleaned = []
        for r in data["currencies"]:
            if isinstance(r, RateIn):
                r = r.model_dump()
            code = (r.get("code") or "").upper()
            if code not in CURRENCY_INFO:
                raise HTTPException(status_code=400, detail=f"Unsupported currency: {code}")
            if code == s.base_currency:
                continue
            cleaned.append({"code": code, "rate": float(r.get("rate", 1)), "enabled": bool(r.get("enabled", True))})
        data["currencies"] = cleaned

    if "base_currency" in data and data["base_currency"]:
        code = data["base_currency"].upper()
        if code not in CURRENCY_INFO:
            raise HTTPException(status_code=400, detail=f"Unsupported base currency: {code}")
        data["base_currency"] = code

    for k, v in data.items():
        if k == "stripe_secret_key" and v in ("", None):
            continue  # keep existing key when clearing
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return settings_dict(s)
