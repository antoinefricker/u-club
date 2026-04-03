.DEFAULT_GOAL := help

.PHONY: help dev

help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## //'

## dev: Start postgres and api in dev mode
dev:
	docker compose up -d postgres
	pnpm dev:api
