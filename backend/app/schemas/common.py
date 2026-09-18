from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    limit: int
    pages: int


class Msg(BaseModel):
    detail: str


class PagedMsg(BaseModel):
    detail: str
    data: dict | list | None = None


def pick(obj, field: str, lang: str) -> str:
    """Pick the localized value of a bilingual model field (name_ar/name_en style)."""
    value = getattr(obj, f"{field}_{lang}", None)
    if value:
        return value
    other = "en" if lang == "ar" else "ar"
    value = getattr(obj, f"{field}_{other}", None)
    return value or ""
