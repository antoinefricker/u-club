<p align="center">
  <img src="./documentation/eggplant-logo.png" alt="Eggplant" width="320" />
</p>

# Eggplant

Basketball club management platform designed for medium-sized organisations. Manage clubs, teams, members, events, and game-day assignments — from roster planning to match logistics.

## Getting started

### Summary

- **Frontend**: React 19, Mantine, TanStack Query, Vite (PWA)
- **Backend**: Express 5, Knex, PostgreSQL, Zod, JWT auth
- **Testing**: Vitest, Playwright, Supertest
- **Tooling**: GitHub Actions, Husky, lint-staged, Docker

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) >= 10
- [Docker](https://www.docker.com/)
- [direnv](https://direnv.net/)

### Installation

```bash
# Clone the repo
git clone git@github.com:antoinefricker/eggplant.git
cd eggplant

# Set up environment variables
cp .envrc.dist .envrc
direnv allow

# Install dependencies
make install

# Start services and API
make dev-start

# Run migrations
make migrate

# Seed database (optional)
make seed-create
```

## Services

- **PWA**: http://localhost:5173
- **API**: http://localhost:4000
- **API docs** (Swagger): http://localhost:4000/api-docs
- **Mailpit** (email inbox): http://localhost:8025
- **Postgres**: localhost:5432

## Available commands

Run `make help` to list all commands:

```
install        Install dependencies
lint           Run linter on all packages
lint-fix       Fix lint issues on all packages
format         Format all packages
format-check   Check formatting on all packages
typecheck      Type-check all packages
test           Run tests on all packages
test-e2e       Run Playwright e2e tests (requires dev servers running)
migrate        Run pending migrations
migrate-up     Run the next pending migration
migrate-down   Rollback the last migration
migrate-status Show current migration status
migrate-make   Create a new migration (usage: make migrate-make name=create_users)
seed-create    Clear and seed database with dev data (use FORCE=1 to skip confirmation)
seed-clear     Clear all data from database (use FORCE=1 to skip confirmation)
status         Check availability of Postgres, API and PWA
dev-start      Start postgres, mailpit, api and pwa in dev mode
dev-stop       Stop dev services (node servers + docker)
```

## Documentation

- [Project roadmap](./documentation/roadmap.md)
- [Implementation plans](./documentation/plans/index.md)
- [Database diagram](./documentation/database-diagram.mermaid)
- [Bruno API collection](./documentation/bruno)

### Dependencies

#### Frontend

- [Mantine](https://mantine.dev/core/package/)
- [TanStack Query](https://tanstack.com/query/latest)
- [TanStack Router](https://tanstack.com/router/latest)
- [Tabler Icons](https://tabler.io/icons)

#### Backend

- [Express](https://expressjs.com/en/5x/api.html)
- [Knex](https://knexjs.org/guide/)
- [Zod](https://zod.dev)
- [Swagger-JSDoc](https://github.com/Surnet/swagger-jsdoc/tree/v6/docs)
