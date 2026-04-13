.DEFAULT_GOAL := help

.PHONY:  help install lint lint-fix format format-check typecheck test test-e2e dev-start dev-stop migrate migrate-up migrate-down migrate-status migrate-make seed-create seed-clear status

help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## //'

define check_env
    @test -n "$(API_PORT)" -a -n "$(PWA_PORT)" || \
		(echo "Error: environment not loaded. Run 'direnv allow' first." && exit 1)
endef    

define check_postgres
	@docker compose ps postgres --status running -q > /dev/null 2>&1 || \
		(echo "Error: postgres is not running. Run 'docker compose up -d postgres' first." && exit 1)
endef

## install: Install dependencies
install:
	pnpm install

## lint: Run linter on all packages
lint:
	pnpm lint

## lint-fix: Fix lint issues on all packages
lint-fix:
	pnpm lint:fix

## format: Format all packages
format:
	pnpm format

## format-check: Check formatting on all packages
format-check:
	pnpm format:check

## typecheck: Type-check all packages
typecheck:
	pnpm typecheck

## test: Run tests on all packages
test:
	pnpm test

## test-e2e: Run Playwright e2e tests (requires dev servers running)
test-e2e:
	@lsof -ti:$(API_PORT) > /dev/null 2>&1 || (echo "Error: API is not running on port $(API_PORT). Run 'make dev-start' first." && exit 1)
	@lsof -ti:$(PWA_PORT) > /dev/null 2>&1 || (echo "Error: PWA is not running on port $(PWA_PORT). Run 'make dev-start' first." && exit 1)
	pnpm test:e2e

## migrate: Run pending migrations
migrate:
	$(check_postgres)
	pnpm --filter @eggplant/api migrate

## migrate-up: Run the next pending migration
migrate-up:
	$(check_postgres)
	pnpm --filter @eggplant/api migrate:up

## migrate-down: Rollback the last migration
migrate-down:
	$(check_postgres)
	pnpm --filter @eggplant/api migrate:down

## migrate-status: Show current migration status
migrate-status:
	$(check_postgres)
	pnpm --filter @eggplant/api migrate:status

## migrate-make: Create a new migration (usage: make migrate-make name=create_users)
migrate-make:
	pnpm --filter @eggplant/api migrate:make -- $(name)

## seed-create: Clear and seed database with dev data (use FORCE=1 to skip confirmation)
seed-create:
	$(check_postgres)
	pnpm --filter @eggplant/api seed $(if $(filter 1,$(FORCE)),-- --force)

## seed-clear: Clear all data from database (use FORCE=1 to skip confirmation)
seed-clear:
	$(check_postgres)
	pnpm --filter @eggplant/api seed:clear $(if $(filter 1,$(FORCE)),-- --force)

## status: Check availability of Postgres, API and PWA
status:
	pnpm --filter @eggplant/api status

## dev-stop: Stop dev services
dev-stop:
	$(check_env) 
	@-lsof -ti:$(API_PORT) 2>/dev/null | xargs kill 2>/dev/null
	@-lsof -ti:$(PWA_PORT) 2>/dev/null | xargs kill 2>/dev/null
	@docker compose stop postgres mailpit

## dev-start: Start postgres, mailpit, api and pwa in dev mode
dev-start:
	$(check_env)
	@lsof -ti:$(API_PORT) > /dev/null 2>&1 && echo "Error: port $(API_PORT) already in use (API). Run 'make dev-stop' first." && exit 1 || true
	@lsof -ti:$(PWA_PORT) > /dev/null 2>&1 && echo "Error: port $(PWA_PORT) already in use (PWA). Run 'make dev-stop' first." && exit 1 || true
	docker compose up -d postgres mailpit
	pnpm dev:api & pnpm dev:pwa
