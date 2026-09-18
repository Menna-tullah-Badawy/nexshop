#!/bin/sh
# Production entrypoint: run database migrations, then start the API.
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo ">>> Running Alembic migrations..."
  alembic upgrade head
fi

echo ">>> Starting NexShop API..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
