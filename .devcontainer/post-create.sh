#!/usr/bin/env bash
set -euo pipefail
cd /workspace

echo "==> Installing backend dependencies"
python3 -m venv backend/.venv
backend/.venv/bin/pip install --upgrade pip -q
backend/.venv/bin/pip install -r backend/requirements.txt -q

echo "==> Installing app dependencies"
cd app
npm install --no-audit --no-fund
npm run brand

echo "==> Seeding demo data (SQLite)"
cd ..
backend/.venv/bin/python -m app.seed

cat <<'EOF'

------------------------------------------------------------
  NexShop devcontainer ready ✅

  • API:      http://localhost:8000  (Swagger: /docs)
  • App:      run  `make run-web`  (or: cd app && npx expo start)
  • Admin:    admin@nexshop.dev / Admin123!
  • Customer: customer@nexshop.dev / Customer123!

  To use PostgreSQL/Neon instead of SQLite, set in ~/.bashrc:
    export DATABASE_URL="postgresql+psycopg://user:pass@host:5432/db"
------------------------------------------------------------
EOF
