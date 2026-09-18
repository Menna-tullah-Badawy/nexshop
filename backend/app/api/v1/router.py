from fastapi import APIRouter

from . import admin, auth, catalog, meta, orders, payments, uploads

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(meta.router)
api_router.include_router(catalog.router)
api_router.include_router(orders.router)
api_router.include_router(payments.router)
api_router.include_router(admin.router)
api_router.include_router(uploads.router)
