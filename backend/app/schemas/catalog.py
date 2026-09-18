from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from .common import pick


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    name_ar: str
    name_en: str
    image_url: str | None
    is_active: bool

    @property
    def name(self) -> str:  # convenience, used via serializer below
        return self.name_en


def category_out(c, lang: str = "en") -> dict:
    return {
        "id": c.id,
        "slug": c.slug,
        "name": pick(c, "name", lang),
        "name_ar": c.name_ar,
        "name_en": c.name_en,
        "image_url": c.image_url,
        "is_active": c.is_active,
    }


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    text: str | None = Field(default=None, max_length=2000)


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    rating: int
    text: str | None
    created_at: datetime
    user_name: str


def review_out(r) -> dict:
    return {
        "id": r.id,
        "rating": r.rating,
        "text": r.text,
        "created_at": r.created_at,
        "user_name": (r.user.full_name if r.user else "") or "Customer",
    }


class ProductOut(BaseModel):
    id: int
    category_id: int | None
    slug: str
    name_ar: str
    name_en: str
    desc_ar: str | None
    desc_en: str | None
    brand: str | None
    price: float
    sale_price: float | None = None
    sale_ends_at: datetime | None = None
    cost: float | None = None
    stock: int
    images: list[str]
    variants: list | None
    is_active: bool
    is_featured: bool
    rating_avg: float = 0
    review_count: int = 0


class ProductIn(BaseModel):
    slug: str | None = None
    name_ar: str = ""
    name_en: str = ""
    category_id: int | None = None
    desc_ar: str | None = None
    desc_en: str | None = None
    brand: str | None = None
    price: float = Field(ge=0)
    cost: float = Field(default=0, ge=0)
    # Flash sale (time-boxed discount)
    sale_price: float | None = Field(default=None, ge=0)
    sale_starts_at: datetime | None = None
    sale_ends_at: datetime | None = None
    stock: int = Field(default=0, ge=0)
    images: list[str] = []
    variants: list | None = None
    is_active: bool = True
    is_featured: bool = False


def slugify(value: str) -> str:
    import re
    import unicodedata

    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "item"
