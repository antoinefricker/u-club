.DEFAULT_GOAL := help

.PHONY: help install lint lint-fix format format-check typecheck test test-e2e dev-start dev-stop migrate migrate-up migrate-down migrate-status migrate-make

help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## //'

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
	pnpm test:e2e

## migrate: Run pending migrations
migrate:
	$(check_postgres)
	pnpm --filter @u-club/api migrate

## migrate-up: Run the next pending migration
migrate-up:
	$(check_postgres)
	pnpm --filter @u-club/api migrate:up

## migrate-down: Rollback the last migration
migrate-down:
	$(check_postgres)
	pnpm --filter @u-club/api migrate:down

## migrate-status: Show current migration status
migrate-status:
	$(check_postgres)
	pnpm --filter @u-club/api migrate:status

## migrate-make: Create a new migration (usage: make migrate-make name=create_users)
migrate-make:
	pnpm --filter @u-club/api migrate:make -- $(name)

## dev-stop: Stop dev services
dev-stop:
	docker compose stop postgres mailpit

## dev-start: Start postgres, mailpit, api and pwa in dev mode
dev-start:
	docker compose up -d postgres mailpit
	pnpm dev:api & pnpm dev:pwa
