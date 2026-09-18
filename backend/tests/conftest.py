import os
import sys

import pytest

# Point the app at a throwaway SQLite DB BEFORE importing the app
TEST_DB = os.path.join(os.path.dirname(__file__), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["AUTO_SEED"] = "false"
os.environ["AUTO_CREATE_TABLES"] = "true"
os.environ["JWT_SECRET"] = "test-secret-key-0123456789-0123456789"
os.environ["FRONTEND_URL"] = "http://localhost:8081"
os.environ["RATE_LIMIT_ENABLED"] = "false"  # rate limiting has its own dedicated test

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.seed import seed_all  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402


@pytest.fixture(scope="session")
def client():
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    with TestClient(app) as c:
        db = SessionLocal()
        try:
            seed_all(db)
        finally:
            db.close()
        yield c


def register(client, email, password="Passw0rd!x", name="Test User", phone="+201099988877"):
    r = client.post("/api/auth/register", json={"email": email, "password": password, "full_name": name, "phone": phone})
    assert r.status_code == 201, r.text
    return r.json()


def login(client, email, password="Admin123!"):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()


def admin_headers(client):
    tok = login(client, "admin@nexshop.dev")
    return {"Authorization": f"Bearer {tok['access_token']}"}
