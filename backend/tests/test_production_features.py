"""Tests for the production hardening batch:
rate limiting, password reset, image uploads, wallet payments,
flash sales, sales reports and the production demo-payments guard.
"""

import io

from tests.conftest import admin_headers, login, register

PNG_1PX = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000d4944415478da63fcffff3f0300050001ff5ccc590000000049454e44ae426082"
)


# ------------------------------ Rate limiting ------------------------------ #

def test_login_rate_limit_blocks_bruteforce(client):
    from app.core.config import get_settings
    from app.services.rate_limit import reset_buckets

    cfg = get_settings()
    cfg.rate_limit_enabled = True
    reset_buckets()
    try:
        statuses = []
        for _ in range(12):
            r = client.post("/api/auth/login", json={"email": "nobody@x.com", "password": "wrong"})
            statuses.append(r.status_code)
        assert statuses.count(429) >= 1, "rate limiter never fired"
        assert statuses[0] in (401, 404)
    finally:
        cfg.rate_limit_enabled = False
        reset_buckets()


# ------------------------------ Password reset ------------------------------ #

def test_password_reset_full_flow(client):
    from app.db.session import SessionLocal
    from app.models import PasswordResetToken

    email = "forgetful@test.com"
    register(client, email, password="OldPass123!")

    r = client.post("/api/auth/forgot-password", json={"email": email})
    assert r.status_code == 200

    db = SessionLocal()
    try:
        row = db.query(PasswordResetToken).order_by(PasswordResetToken.id.desc()).first()
        token = row.token
    finally:
        db.close()

    # wrong token rejected
    r = client.post("/api/auth/reset-password", json={"token": "x" * 40, "password": "NewPass123!"})
    assert r.status_code == 400

    # correct token works
    r = client.post("/api/auth/reset-password", json={"token": token, "password": "NewPass123!"})
    assert r.status_code == 200, r.text

    # token is single-use
    r = client.post("/api/auth/reset-password", json={"token": token, "password": "Other12345!"})
    assert r.status_code == 400

    # new password logs in, old one doesn't
    assert login(client, email, "NewPass123!")["access_token"]
    r = client.post("/api/auth/login", json={"email": email, "password": "OldPass123!"})
    assert r.status_code == 401


def test_forgot_password_unknown_email_still_200(client):
    r = client.post("/api/auth/forgot-password", json={"email": "ghost@nowhere.com"})
    assert r.status_code == 200  # no user enumeration


# ------------------------------ Image uploads ------------------------------ #

def test_admin_upload_image(client):
    h = admin_headers(client)
    r = client.post(
        "/api/admin/upload",
        headers=h,
        files={"file": ("logo.png", io.BytesIO(PNG_1PX), "image/png")},
    )
    assert r.status_code == 201, r.text
    url = r.json()["url"]
    assert url.startswith("/uploads/") and url.endswith(".png")
    # file is actually served back
    got = client.get(url)
    assert got.status_code == 200
    assert got.content == PNG_1PX


def test_upload_rejects_non_images_and_requires_admin(client):
    h = admin_headers(client)
    r = client.post(
        "/api/admin/upload",
        headers=h,
        files={"file": ("evil.exe", io.BytesIO(b"MZ..."), "application/octet-stream")},
    )
    assert r.status_code == 400

    r = client.post(
        "/api/admin/upload",
        files={"file": ("logo.png", io.BytesIO(PNG_1PX), "image/png")},
    )
    assert r.status_code in (401, 403)


# ------------------------------ Wallet payments ------------------------------ #

def _wallet_checkout(client, tok, method):
    return client.post(
        "/api/orders",
        json={
            "items": [{"product_id": 1, "qty": 1}],
            "address": {"full_name": "عميل المحفظة", "phone": "+201022233344"},
            "governorate_id": 1,
            "payment_method": method,
        },
        headers={"Authorization": f"Bearer {tok}"},
    )


def test_vodafone_cash_order_gets_reference(client):
    tok = register(client, "wallet1@test.com")["access_token"]
    r = _wallet_checkout(client, tok, "vodafone_cash")
    assert r.status_code == 201, r.text
    order = r.json()["order"]
    assert order["payment_method"] == "vodafone_cash"
    assert order["payment_status"] == "pending"
    assert order["payment_reference"], "wallet order must expose a transfer reference"
    assert r.json()["payment"]["provider"] == "vodafone_cash"

    # merchant confirms the transfer
    h = admin_headers(client)
    r = client.post(f"/api/admin/orders/{order['id']}/mark-paid", headers=h)
    assert r.json()["payment_status"] == "paid"


def test_instapay_order(client):
    tok = register(client, "wallet2@test.com")["access_token"]
    r = _wallet_checkout(client, tok, "instapay")
    assert r.status_code == 201, r.text
    assert r.json()["order"]["payment_reference"]


def test_fawry_disabled_by_default(client):
    tok = register(client, "wallet3@test.com")["access_token"]
    r = _wallet_checkout(client, tok, "fawry")
    assert r.status_code == 400


def test_brand_exposes_wallet_config(client):
    r = client.get("/api/meta/brand")
    assert r.status_code == 200
    b = r.json()
    assert b["payments"]["wallet"] is True
    assert b["payments"]["wallet_phone"] == "01000000000"
    assert b["payments"]["instapay_address"] == "nexshop@instapay"
    assert b["payments"]["fawry"] is False
    assert b["whatsapp_number"] == "+201000000000"


# ------------------------------ Flash sales ------------------------------ #

def test_flash_sale_prices(client):
    """Seeded last-two products carry an active flash sale (20% off)."""
    r = client.get("/api/products?sort=newest&limit=50")
    assert r.status_code == 200
    items = r.json()["items"]
    on_sale = [p for p in items if p.get("sale_price")]
    assert len(on_sale) >= 2
    for p in on_sale:
        assert p["sale_price"] < p["price"]

    # checkout uses the sale price (last product, qty 1)
    p = on_sale[0]
    tok = register(client, "sale1@test.com")["access_token"]
    r = client.post(
        "/api/orders",
        json={
            "items": [{"product_id": p["id"], "qty": 1}],
            "address": {"full_name": "مشتري العروض", "phone": "+201033344455"},
            "governorate_id": 1,
            "payment_method": "cod",
        },
        headers={"Authorization": f"Bearer {tok}"},
    )
    assert r.status_code == 201, r.text
    o = r.json()["order"]
    assert o["base_subtotal"] == p["sale_price"]


# ------------------------------ Reports ------------------------------ #

def test_sales_reports(client):
    h = admin_headers(client)
    r = client.get("/api/admin/reports/products?days=30", headers=h)
    assert r.status_code == 200
    rows = r.json()
    assert rows and all(k in rows[0] for k in ("name", "units_sold", "revenue", "orders"))
    # sorted by revenue desc
    revenues = [x["revenue"] for x in rows]
    assert revenues == sorted(revenues, reverse=True)


def test_low_stock_report(client):
    h = admin_headers(client)
    r = client.get("/api/admin/reports/low-stock", headers=h)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ------------------------------ Production demo guard ------------------------------ #

def test_demo_payments_disabled_in_production(client):
    from app.core.config import get_settings

    cfg = get_settings()
    assert cfg.env not in ("production", "prod")  # sanity: dev right now

    # pin a known settings state (other suites may mutate global settings)
    h = admin_headers(client)
    r = client.put("/api/admin/settings", headers=h, json={"demo_payments": True, "stripe_enabled": False})
    assert r.status_code == 200

    tok = register(client, "prodguard@test.com")["access_token"]
    cfg.env = "production"
    try:
        # demo mode is seeded ON, but production must refuse fake card payments
        r = client.post(
            "/api/orders",
            json={
                "items": [{"product_id": 1, "qty": 1}],
                "address": {"full_name": "X", "phone": "+201000000001"},
                "governorate_id": 1,
                "payment_method": "stripe",
            },
            headers={"Authorization": f"Bearer {tok}"},
        )
        assert r.status_code == 400

        # brand endpoint no longer advertises demo
        b = client.get("/api/meta/brand").json()
        assert b["payments"]["demo"] is False

        # COD still fine
        r = client.post(
            "/api/orders",
            json={
                "items": [{"product_id": 1, "qty": 1}],
                "address": {"full_name": "X", "phone": "+201000000001"},
                "governorate_id": 1,
                "payment_method": "cod",
            },
            headers={"Authorization": f"Bearer {tok}"},
        )
        assert r.status_code == 201
    finally:
        cfg.env = "development"


def test_settings_include_new_fields(client):
    h = admin_headers(client)
    s = client.get("/api/admin/settings", headers=h).json()
    for k in ("wallet_enabled", "wallet_phone", "instapay_address", "fawry_enabled",
              "whatsapp_number", "low_stock_threshold", "demo_payments"):
        assert k in s
    # admin can update them
    r = client.put("/api/admin/settings", headers=h, json={"low_stock_threshold": 3, "whatsapp_number": "+201099999999"})
    assert r.status_code == 200
    assert r.json()["low_stock_threshold"] == 3
    assert r.json()["whatsapp_number"] == "+201099999999"
