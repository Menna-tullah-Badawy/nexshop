from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api.v1.router import api_router
from .core.config import get_settings
from .db.base import Base
from .db.session import engine, SessionLocal
from .models import SiteSettings, User
from .schemas import Msg
from .services import get_settings_row

settings = get_settings()

STATIC_DIR = Path(__file__).parent.parent / "static"
UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _init_db() -> None:
    from .models import (  # noqa: F401  (ensure models registered)
        Address, Category, Governorate, Order, OrderItem, Product, Promo, Review, User,
    )
    from .db.base import Base as _B

    if settings.auto_create_tables:
        _B.metadata.create_all(bind=engine)


def _auto_seed() -> None:
    if not settings.auto_seed:
        return
    db = SessionLocal()
    try:
        has_user = db.query(User).first() is not None
        if not has_user:
            from .seed import seed_all

            seed_all(db)
        else:
            get_settings_row(db)
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _init_db()
    _auto_seed()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(api_router, prefix="/api")


@app.get("/api/health", response_model=Msg)
def health():
    return Msg(detail=f"{settings.app_name} v{settings.app_version} is alive")


@app.get("/", response_model=Msg)
def root():
    return Msg(detail=f"{settings.app_name} API — docs at /docs")
