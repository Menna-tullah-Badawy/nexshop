from conftest import admin_headers, login, register


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert "alive" in r.json()["detail"]


def test_register_login_me(client):
    tok = register(client, "alice@test.com", name="Alice")
    h = {"Authorization": f"Bearer {tok['access_token']}"}
    me = client.get("/api/auth/me", headers=h)
    assert me.status_code == 200
    assert me.json()["email"] == "alice@test.com"
    assert me.json()["role"] == "customer"


def test_login_wrong_password(client):
    r = client.post("/api/auth/login", json={"email": "admin@nexshop.dev", "password": "wrong"})
    assert r.status_code == 401


def test_refresh_flow(client):
    tok = register(client, "bob@test.com")
    r = client.post("/api/auth/refresh", json={"refresh_token": tok["refresh_token"]})
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_admin_guard(client):
    h_user = {"Authorization": f"Bearer {register(client, 'carol@test.com')['access_token']}"}
    r = client.get("/api/admin/dashboard", headers=h_user)
    assert r.status_code == 403

    r = client.get("/api/admin/dashboard", headers=admin_headers(client))
    assert r.status_code == 200


def test_update_currency(client):
    tok = register(client, "currency@test.com")
    h = {"Authorization": f"Bearer {tok['access_token']}"}
    r = client.patch("/api/auth/me", json={"currency": "USD"}, headers=h)
    assert r.status_code == 200
    assert r.json()["currency"] == "USD"
