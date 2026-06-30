.PHONY: help install migrate dev build start stop docker-build docker-up docker-down docker-logs clean

APP_NAME = pick-the-place

help: ## Zeigt diese Hilfe an
	@echo "╔══════════════════════════════════════════════╗"
	@echo "║  $(APP_NAME) – Makefile                       ║"
	@echo "╚══════════════════════════════════════════════╝"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ─── Setup ───────────────────────────────────────────────────────────────────

install: ## Installiert alle npm-Abhängigkeiten
	npm install

migrate: ## Führt Prisma-Migration aus und generiert Client
	npx prisma migrate dev

generate: ## Generiert Prisma Client (nach Schema-Änderungen)
	npx prisma generate

db-studio: ## Öffnet Prisma Studio (GUI für die Datenbank)
	npx prisma studio

# ─── Entwicklung ─────────────────────────────────────────────────────────────

dev: ## Startet den Next.js Dev-Server (http://localhost:3000)
	npm run dev

build: ## Erstellt einen Production-Build
	npm run build

start: ## Startet den Production-Server (vorher build ausführen)
	npm start

stop: ## Stoppt den lokalen Dev-Server (SIGTERM an node)
	@echo "🔍 Suche nach Next.js-Prozessen..."
	@pkill -f "next dev" 2>/dev/null && echo "✅ Dev-Server gestoppt" || echo "⚠️  Kein Dev-Server gefunden"
	@pkill -f "next start" 2>/dev/null; true

lint: ## Führt ESLint aus
	npm run lint

# ─── Docker ──────────────────────────────────────────────────────────────────

docker-build: ## Baut das Docker-Image
	docker compose build

docker-up: ## Startet alle Docker-Container im Hintergrund
	docker compose up -d

docker-down: ## Stoppt und entfernt alle Docker-Container
	docker compose down

docker-logs: ## Zeigt die Logs der Docker-Container an
	docker compose logs -f

docker-restart: docker-down docker-up ## Startet die Docker-Container neu

# ─── Datenbank ───────────────────────────────────────────────────────────────

db-reset: ## Löscht die Datenbank und erstellt sie neu (mit Migration)
	@echo "⚠️  ACHTUNG: Alle Daten gehen verloren!"
	@rm -f ./dev.db ./dev.db-journal
	rm -rf prisma/migrations
	npx prisma migrate dev --name init

db-seed: ## Füllt die Datenbank mit Testdaten (sofern seed.ts existiert)
	npx prisma db seed

# ─── Cleanup ─────────────────────────────────────────────────────────────────

clean: ## Entfernt node_modules, .next, Datenbank und generierte Dateien
	@echo "🧹 Räume auf..."
	rm -rf .next
	rm -rf node_modules
	rm -rf src/generated/prisma
	@echo "✅ Fertig. Führe 'make install' und 'make migrate' aus, um neu aufzubauen."
