from conftest import register


def test_brand_endpoint(client):
    r = client.get("/api/meta/brand")
    assert r.status_code == 200
    b = r.json()
    assert b["store_name"]
    assert b["base_currency"] == "EGP"
    assert any(c["code"] == "USD" for c in b["currencies"])
    assert len(b["delivery"]["zones"]) >= 27


def test_categories(client):
    r = client.get("/api/categories", params={"lang": "ar"})
    assert r.status_code == 200
    assert len(r.json()) >= 6
    assert r.json()[0]["name"]


def test_products_search_and_filter(client):
    r = client.get("/api/products", params={"q": "سماعات"})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1
    assert all("سماعات" in (i["name_ar"] or i["name_en"]) for i in body["items"])

    r2 = client.get("/api/products", params={"category": "electronics", "sort": "price_asc"})
    assert r2.status_code == 200
    prices = [i["price"] for i in r2.json()["items"]]
    assert prices == sorted(prices)


def test_product_detail_and_reviews(client):
    r = client.get("/api/products/wireless-bluetooth-headphones")
    assert r.status_code == 200
    p = r.json()
    assert p["price"] == 1850
    assert p["images"]

    tok = register(client, "reviewer@test.com")
    h = {"Authorization": f"Bearer {tok['access_token']}"}
    r2 = client.post(
        "/api/products/wireless-bluetooth-headphones/reviews",
        json={"rating": 4, "text": "جيد جدًا"},
        headers=h,
    )
    assert r2.status_code == 201
    r3 = client.get("/api/products/wireless-bluetooth-headphones/reviews")
    assert r3.status_code == 200
    assert r3.json()["count"] >= 1
