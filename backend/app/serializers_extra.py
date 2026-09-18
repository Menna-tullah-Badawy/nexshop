"""Shared serialization helpers (model -> dict)."""

from __future__ import annotations


def product_dict(p, include_cost: bool = False) -> dict:
    revs = p.reviews or []
    avg = round(sum(r.rating for r in revs) / len(revs), 2) if revs else 0
    d = {
        "id": p.id,
        "category_id": p.category_id,
        "slug": p.slug,
        "name_ar": p.name_ar,
        "name_en": p.name_en,
        "desc_ar": p.desc_ar,
        "desc_en": p.desc_en,
        "brand": p.brand,
        "price": float(p.price),
        "stock": p.stock,
        "images": p.images or [],
        "variants": p.variants,
        "is_active": p.is_active,
        "is_featured": p.is_featured,
        "rating_avg": avg,
        "review_count": len(revs),
    }
    if include_cost:
        d["cost"] = float(p.cost or 0)
    return d


def order_dict(o) -> dict:
    return {
        "id": o.id,
        "order_no": o.order_no,
        "status": o.status,
        "payment_method": o.payment_method,
        "payment_status": o.payment_status,
        "currency": o.currency,
        "rate": float(o.rate or 1),
        "subtotal": float(o.subtotal or 0),
        "delivery_fee": float(o.delivery_fee or 0),
        "discount": float(o.discount or 0),
        "total": float(o.total or 0),
        "base_subtotal": float(o.base_subtotal or 0),
        "base_delivery": float(o.base_delivery or 0),
        "base_discount": float(o.base_discount or 0),
        "base_total": float(o.base_total or 0),
        "promo_code": o.promo_code,
        "customer_name": o.customer_name,
        "customer_phone": o.customer_phone,
        "address": o.address,
        "governorate": o.governorate,
        "notes": o.notes,
        "courier_name": o.courier_name,
        "courier_phone": o.courier_phone,
        "created_at": o.created_at,
        "delivered_at": o.delivered_at,
        "items": [
            {
                "id": it.id,
                "product_id": it.product_id,
                "name_ar": it.name_ar,
                "name_en": it.name_en,
                "image": it.image,
                "variant": it.variant,
                "price": float(it.price),
                "qty": it.qty,
                "line_total": float(it.line_total),
            }
            for it in o.items
        ],
    }


def settings_dict(s) -> dict:
    return {
        "id": s.id,
        "store_name": s.store_name,
        "tagline_ar": s.tagline_ar,
        "tagline_en": s.tagline_en,
        "logo_url": s.logo_url,
        "primary_color": s.primary_color,
        "theme_preset": s.theme_preset,
        "dark_default": s.dark_default,
        "announcement_ar": s.announcement_ar,
        "announcement_en": s.announcement_en,
        "base_currency": s.base_currency,
        "currencies": s.currencies or [],
        "delivery_enabled": s.delivery_enabled,
        "free_delivery_above": float(s.free_delivery_above or 0),
        "cod_enabled": s.cod_enabled,
        "stripe_enabled": s.stripe_enabled,
        "stripe_secret_key": s.stripe_secret_key,
        "demo_payments": s.demo_payments,
        "contact_phone": s.contact_phone,
        "contact_email": s.contact_email,
        "contact_address": s.contact_address,
        "social": s.social or {},
        "updated_at": s.updated_at,
    }
