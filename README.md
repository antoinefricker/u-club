<p align="center">
  <img src="./documentation/eggplant-logo.png" alt="Eggplant" width="120" />
</p>

# eggplant

Monorepo for the eggplant project.

## Local URLs

- **PWA**: http://localhost:5173
- **API**: http://localhost:4000
- **API docs** (Swagger): http://localhost:4000/api-docs
- **Mailpit** (email inbox): http://localhost:8025

## Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) >= 10
- [Docker](https://www.docker.com/)
- [direnv](https://direnv.net/)

## Getting started

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
```

## Services

| Service  | URL                            |
| -------- | ------------------------------ |
| PWA      | http://localhost:5173          |
| API      | http://localhost:4000          |
| API docs | http://localhost:4000/api-docs |
| Mailpit  | http://localhost:8025          |
| Postgres | localhost:5432                 |

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
seed           Clear and seed database with dev data
seed-clear     Clear all data from database
dev-start      Start postgres, mailpit, api and pwa in dev mode
dev-stop       Stop dev services (node servers + docker)
```

## Documentations

- [Project roadmap](./documentation/roadmap.md)
- Past Claude plans are stored in [`documentation/plans`](./documentation/plans/index.md)
- The entity-relationship diagram is maintained in [`database-diagram.mermaid`](./documentation/database-diagram.mermaid)
- API routes are testable through a [Bruno](https://www.usebruno.com/) collection under [`documentation/bruno`](./documentation/bruno)

### Dependencies documentation

- Front
  - [TanStack router](https://tanstack.com/router/latest)
  - [TanStack query](https://tanstack.com/query/latest)
  - [Mantine components](https://mantine.dev/core/package/)
  - [Tabler icons](https://tabler.io/icons)
- Back
  - [Express](https://expressjs.com/en/5x/api.html)
  - [Knex](https://knexjs.org/guide/)
  - [Swagger-JSDoc](https://github.com/Surnet/swagger-jsdoc/tree/v6/docs)
