from conftest import admin_headers, register


def _checkout(client, token, payment="cod", promo=None, currency=None, product_qty=None):
    h = {"Authorization": f"Bearer {token}"}
    body = {
        "items": [{"product_id": 1, "qty": (product_qty or {}).get(1, 1)}],
        "address": {"label": "home", "full_name": "عميل تجريبي", "phone": "+201011122233",
                    "city": "القاهرة", "street": "شارع 1", "notes": ""},
        "governorate_id": 1,
        "payment_method": payment,
    }
    if promo:
        body["promo_code"] = promo
    if currency:
        r = client.patch("/api/auth/me", json={"currency": currency}, headers=h)
        assert r.status_code == 200
    r = client.post("/api/orders", json=body, headers=h)
    assert r.status_code == 201, r.text
    return r.json()


def test_cod_order_totals(client):
    tok = register(client, "shopper1@test.com")["access_token"]
    res = _checkout(client, tok, payment="cod")
    o = res["order"]
    # 1 x 1850 + 25 delivery (Cairo)
    assert o["base_subtotal"] == 1850
    assert o["base_delivery"] == 25
    assert o["base_total"] == 1875
    assert o["total"] == 1875
    assert o["currency"] == "EGP"
    assert o["status"] == "pending"
    assert o["payment_status"] == "pending"
    assert res["payment"]["provider"] == "cod"

    # stock decremented
    r = client.get("/api/products/wireless-bluetooth-headphones")
    assert r.json()["stock"] == 41


def test_promo_percent_and_fixed(client):
    tok = register(client, "shopper2@test.com")["access_token"]
    res = _checkout(client, tok, promo="WELCOME10")
    o = res["order"]
    assert o["base_discount"] == 185.0
    assert o["base_total"] == 1850 - 185 + 25

    tok2 = register(client, "shopper3@test.com")["access_token"]
    res2 = _checkout(client, tok2, promo="SAVE50")
    assert res2["order"]["base_discount"] == 50.0


def test_invalid_promo(client):
    tok = register(client, "shopper4@test.com")["access_token"]
    h = {"Authorization": f"Bearer {tok}"}
    r = client.post("/api/orders", json={
        "items": [{"product_id": 1, "qty": 1}],
        "address": {"full_name": "x", "phone": "1"},
        "governorate_id": 1, "payment_method": "cod", "promo_code": "NOPE",
    }, headers=h)
    assert r.status_code == 400


def test_out_of_stock(client):
    tok = register(client, "shopper5@test.com")["access_token"]
    h = {"Authorization": f"Bearer {tok}"}
    r = client.post("/api/orders", json={
        "items": [{"product_id": 1, "qty": 999}],
        "address": {"full_name": "x", "phone": "1"},
        "governorate_id": 1, "payment_method": "cod",
    }, headers=h)
    assert r.status_code == 409


def test_usd_currency_conversion(client):
    tok = register(client, "shopper6@test.com")["access_token"]
    res = _checkout(client, tok, currency="USD")
    o = res["order"]
    assert o["currency"] == "USD"
    assert o["rate"] > 0
    assert o["base_total"] == 1875
    # display total must be base_total converted at the stored rate
    assert abs(o["total"] - round(o["base_total"] * o["rate"], 2)) < 0.02


def test_demo_stripe_marks_paid(client):
    tok = register(client, "shopper7@test.com")["access_token"]
    res = _checkout(client, tok, payment="stripe")
    assert res["payment"]["provider"] == "demo"
    assert res["order"]["payment_status"] == "paid"


def test_order_lifecycle_admin(client):
    tok = register(client, "shopper8@test.com")["access_token"]
    res = _checkout(client, tok)
    oid = res["order"]["id"]

    h = admin_headers(client)
    r = client.post(f"/api/admin/orders/{oid}/next", headers=h)
    assert r.status_code == 200 and r.json()["status"] == "confirmed"
    r = client.patch(f"/api/admin/orders/{oid}", json={"courier_name": "محمود", "courier_phone": "0100"}, headers=h)
    assert r.json()["courier_name"] == "محمود"
    client.post(f"/api/admin/orders/{oid}/next", headers=h)  # packing
    r = client.post(f"/api/admin/orders/{oid}/next", headers=h)  # out_for_delivery
    assert r.json()["status"] == "out_for_delivery"
    r = client.post(f"/api/admin/orders/{oid}/next", headers=h)  # delivered
    assert r.json()["status"] == "delivered"
    assert r.json()["payment_status"] == "paid"  # COD auto-paid on delivery
    assert r.json()["delivered_at"] is not None

    # user sees final state
    huser = {"Authorization": f"Bearer {tok}"}
    r = client.get(f"/api/orders/{res['order']['order_no']}", headers=huser)
    assert r.json()["status"] == "delivered"


def test_cancel_pending_restores_stock(client):
    before = client.get("/api/products/wireless-bluetooth-headphones").json()["stock"]
    tok = register(client, "shopper9@test.com")["access_token"]
    res = _checkout(client, tok)
    o = res["order"]
    h = {"Authorization": f"Bearer {tok}"}
    r = client.post(f"/api/orders/{o['order_no']}/cancel", headers=h)
    assert r.status_code == 200
    assert r.json()["status"] == "cancelled"
    after = client.get("/api/products/wireless-bluetooth-headphones").json()["stock"]
    assert after == before
