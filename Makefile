dev:
	docker compose up -d postgres
	pnpm dev:api
