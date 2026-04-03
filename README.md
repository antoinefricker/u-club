# u-club

Monorepo for the u-club project.

## Local URLs

- **API**: http://localhost:4000
- **Mailpit** (email inbox): http://localhost:8025

## Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) >= 10
- [Docker](https://www.docker.com/)
- [direnv](https://direnv.net/)

## Getting started

```bash
# Clone the repo
git clone git@github.com:antoinefricker/u-club.git
cd u-club

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

| Service  | URL                        |
| -------- | -------------------------- |
| API      | http://localhost:4000      |
| Mailpit  | http://localhost:8025      |
| Postgres | localhost:5432             |

## Available commands

Run `make help` to list all commands:

```
install        Install dependencies
migrate        Run pending migrations
migrate-up     Run the next pending migration
migrate-down   Rollback the last migration
migrate-status Show current migration status
migrate-make   Create a new migration
dev-start      Start postgres, mailpit and api in dev mode
dev-stop       Stop dev services
```
