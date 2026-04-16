.PHONY: run dev test install docker-build docker

run:
	uvicorn app.main:app --host 0.0.0.0 --port 8000

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

install:
	pip install -r requirements.txt

install-train:
	pip install -r requirements-train.txt

test:
	pytest -v

lint:
	ruff check .

docker-build:
	docker build -t agri-ai-service .

docker:
	docker run -d -p 8000:8000 --name agri-ai agri-ai-service

docker-stop:
	docker stop agri-ai && docker rm agri-ai

help:
	@echo "Available targets:"
	@echo "  make run          - Start uvicorn server (no reload)"
	@echo "  make dev          - Start uvicorn with auto-reload"
	@echo "  make install      - Install production dependencies"
	@echo "  make install-train- Install + training dependencies"
	@echo "  make test         - Run tests"
	@echo "  make lint         - Run ruff linter"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker       - Run Docker container"
	@echo "  make docker-stop  - Stop and remove container"