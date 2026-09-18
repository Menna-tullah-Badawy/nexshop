from conftest import admin_headers


def test_dashboard_shape(client):
    r = client.get("/api/admin/dashboard", headers=admin_headers(client))
    assert r.status_code == 200
    d = r.json()
    for key in (
        "today_revenue", "today_orders", "month_revenue", "month_orders",
        "total_customers", "total_products", "status_counts", "pending_delivery",
        "low_stock", "top_products", "recent_orders", "last_14_days",
    ):
        assert key in d
    assert len(d["last_14_days"]) == 14


def test_product_crud(client):
    h = admin_headers(client)
    r = client.post("/api/admin/products", json={
        "name_ar": "منتج تجريبي", "name_en": "Test Product",
        "price": 100, "stock": 10, "images": ["https://example.com/x.jpg"],
        "variants": [{"label": "Color", "values": ["Red", "Blue"]}],
    }, headers=h)
    assert r.status_code == 201, r.text
    pid = r.json()["id"]
    assert r.json()["slug"] == "test-product"

    r2 = client.put(f"/api/admin/products/{pid}", json={
        "name_ar": "منتج تجريبي 2", "name_en": "Test Product 2",
        "price": 120, "stock": 11,
    }, headers=h)
    assert r2.status_code == 200
    assert r2.json()["price"] == 120

    r3 = client.post(f"/api/admin/products/{pid}/toggle", headers=h)
    assert r3.json()["is_active"] is False

    r4 = client.delete(f"/api/admin/products/{pid}", headers=h)
    assert r4.status_code == 200


def test_category_crud(client):
    h = admin_headers(client)
    r = client.post("/api/admin/categories", json={
        "name_ar": "تصنيف جديد", "name_en": "New Category",
    }, headers=h)
    assert r.status_code == 201
    cid = r.json()["id"]
    r2 = client.delete(f"/api/admin/categories/{cid}", headers=h)
    assert r2.status_code == 200


def test_promo_crud(client):
    h = admin_headers(client)
    r = client.post("/api/admin/promos", json={"code": "TEST20", "type": "percent", "value": 20}, headers=h)
    assert r.status_code == 201
    pid = r.json()["id"]
    r2 = client.delete(f"/api/admin/promos/{pid}", headers=h)
    assert r2.status_code == 200


def test_settings_white_label(client):
    h = admin_headers(client)
    r = client.put("/api/admin/settings", json={
        "store_name": "BlueMart",
        "primary_color": "#0066FF",
        "theme_preset": "marketplace",
        "currencies": [
            {"code": "USD", "rate": 0.021, "enabled": True},
            {"code": "SAR", "rate": 0.075, "enabled": True},
            {"code": "AED", "rate": 0.073, "enabled": False},
        ],
        "cod_enabled": True,
        "demo_payments": False,
        "stripe_enabled": True,
    }, headers=h)
    assert r.status_code == 200, r.text
    assert r.json()["store_name"] == "BlueMart"

    b = client.get("/api/meta/brand").json()
    assert b["store_name"] == "BlueMart"
    assert b["primary_color"] == "#0066FF"
    codes = [c["code"] for c in b["currencies"]]
    assert "AED" not in codes  # disabled currency hidden from clients
    assert "USD" in codes

    # invalid currency rejected
    r2 = client.put("/api/admin/settings", json={"currencies": [{"code": "XYZ", "rate": 1}]}, headers=h)
    assert r2.status_code == 400


def test_governorate_fees(client):
    h = admin_headers(client)
    r = client.get("/api/admin/governorates", headers=h)
    assert r.status_code == 200
    zones = r.json()
    assert len(zones) >= 27
    r2 = client.put(f"/api/admin/governorates/{zones[0]['id']}", json={"fee": 30}, headers=h)
    assert r2.json()["fee"] == 30


def test_customers_list(client):
    h = admin_headers(client)
    r = client.get("/api/admin/customers", headers=h)
    assert r.status_code == 200
    assert r.json()["total"] >= 1
    item = r.json()["items"][0]
    for key in ("email", "full_name", "orders_count", "total_spent", "currency"):
        assert key in item


def test_orders_export_csv(client):
    h = admin_headers(client)
    r = client.get("/api/admin/orders/export", headers=h)
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    assert "order_no" in r.text
