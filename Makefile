.PHONY: setup seed test run-api run-web docker-up docker-down typecheck

PY ?= python3

setup: ## Create venv + install backend deps + install app deps
	$(PY) -m venv backend/.venv
	backend/.venv/bin/pip install -r backend/requirements.txt
	cd app && npm install

seed: ## Seed demo data
	cd backend && .venv/bin/python -m app.seed

test: ## Run backend test suite
	cd backend && .venv/bin/pytest -q

run-api: ## Run FastAPI dev server
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000

run-web: ## Run Expo (mobile + web)
	cd app && npx expo start

typecheck: ## TypeScript check for the app
	cd app && npx tsc --noEmit

docker-up: ## Full stack with Docker
	docker compose up --build

docker-down:
	docker compose down
