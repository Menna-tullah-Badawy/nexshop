from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ...core.deps import get_current_user, get_db
from ...models import Category, Product, Review, User
from ...schemas import Page, ProductOut, ReviewIn
from ...schemas.catalog import category_out, review_out
from .serializers import product_dict

router = APIRouter(tags=["catalog"])


@router.get("/categories", response_model=list[dict])
def list_categories(lang: str = "en", db: Session = Depends(get_db)):
    cats = db.execute(
        select(Category).where(Category.is_active.is_(True)).order_by(Category.sort_order, Category.id)
    ).scalars().all()
    return [category_out(c, lang) for c in cats]


@router.get("/products", response_model=Page[ProductOut])
def list_products(
    q: str | None = None,
    category: str | None = None,
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    sort: str = "newest",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    stmt = select(Product).where(Product.is_active.is_(True))
    if category:
        stmt = stmt.join(Category, Product.category_id == Category.id).where(Category.slug == category)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Product.name_ar.ilike(like), Product.name_en.ilike(like), Product.brand.ilike(like)))
    if min_price is not None:
        stmt = stmt.where(Product.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Product.price <= max_price)

    sort_map = {
        "newest": Product.created_at.desc(),
        "price_asc": Product.price.asc(),
        "price_desc": Product.price.desc(),
        "featured": Product.is_featured.desc(),
    }
    stmt = stmt.order_by(sort_map.get(sort, Product.created_at.desc()), Product.id.desc())

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    rows = db.execute(stmt.offset((page - 1) * limit).limit(limit)).scalars().all()

    items = [product_dict(p) for p in rows]
    pages = max(1, -(-total // limit))
    return Page(items=items, total=total, page=page, limit=limit, pages=pages)


@router.get("/products/{slug}", response_model=dict)
def get_product(slug: str, db: Session = Depends(get_db)):
    p = db.execute(select(Product).where(Product.slug == slug)).scalar_one_or_none()
    if p is None or not p.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    d = product_dict(p)
    d["category"] = (
        {"id": p.category.id, "slug": p.category.slug, "name_ar": p.category.name_ar, "name_en": p.category.name_en}
        if p.category
        else None
    )
    return d


# ------------------------------ Reviews ------------------------------ #

@router.get("/products/{slug}/reviews", response_model=dict)
def list_reviews(slug: str, limit: int = Query(default=20, ge=1, le=100), db: Session = Depends(get_db)):
    p = db.execute(select(Product).where(Product.slug == slug)).scalar_one_or_none()
    if p is None:
        raise HTTPException(status_code=404, detail="Product not found")
    revs = sorted(p.reviews, key=lambda r: r.created_at or 0, reverse=True)[:limit]
    avg = round(sum(r.rating for r in p.reviews) / len(p.reviews), 2) if p.reviews else 0
    return {"reviews": [review_out(r) for r in revs], "rating_avg": avg, "count": len(p.reviews)}


@router.post("/products/{slug}/reviews", response_model=dict, status_code=201)
def upsert_review(
    slug: str, body: ReviewIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    p = db.execute(select(Product).where(Product.slug == slug)).scalar_one_or_none()
    if p is None or not p.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    existing = db.execute(
        select(Review).where(Review.product_id == p.id, Review.user_id == user.id)
    ).scalar_one_or_none()
    if existing:
        existing.rating = body.rating
        existing.text = body.text
    else:
        db.add(Review(product_id=p.id, user_id=user.id, rating=body.rating, text=body.text))
    db.commit()
    revs = p.reviews
    avg = round(sum(r.rating for r in revs) / len(revs), 2) if revs else 0
    return {"rating_avg": avg, "count": len(revs)}
