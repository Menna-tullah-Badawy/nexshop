FROM python:3.13-slim

WORKDIR /code
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN chmod +x docker-entrypoint.sh

EXPOSE 8000
# Runs `alembic upgrade head` first (disable with RUN_MIGRATIONS=false)
CMD ["./docker-entrypoint.sh"]
