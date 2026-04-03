.DEFAULT_GOAL := help

.PHONY: help install dev-start dev-stop migrate migrate-up migrate-down migrate-status migrate-make

help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## //'

define check_postgres
	@docker compose ps postgres --status running -q > /dev/null 2>&1 || \
		(echo "Error: postgres is not running. Run 'docker compose up -d postgres' first." && exit 1)
endef

## install: Install dependencies
install:
	pnpm install

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
	docker compose stop postgres

## dev-start: Start postgres and api in dev mode
dev-start:
	docker compose up -d postgres
	pnpm dev:api
