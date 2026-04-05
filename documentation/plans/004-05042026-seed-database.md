# Seed Database

## Context

We need a seed script to populate the dev database with realistic data for testing and development. Also need a clear command to wipe all data.

## Data to generate

- 1 admin user (email/password from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars)
  define default value in .envrc.dist (admin@u-club.app / password123)
- 1 manager user (email/password from `SEED_MANAGER_EMAIL` / `SEED_MANAGER_PASSWORD` env vars)
  define default value in .envrc.dist (manager@u-club.app / password123)
- 4 member statuses (pending validation, active, inactive)
- 2 clubs
  - one club named CSG Baskin' have 3 teams
  - other, named CSG have 30 teams (varied genders, age categories)
- age categories are U7/U9/U11/U13/U15/U18/U21/Senior/Leisure
- age categories may have multiple teams
- 25 members per team
  - 80% of members get a linked user account (role: user, verified, password: password123)
  - Each member assigned to their team (2 coaches, 1 assistant, 22 players)
  - 20% of members belong to multiple teams

## Plan

### 1. Seed script

- **New:** `apps/api/src/seed.ts`
- Uses existing `db.js` and `hashPassword` from `password.ts`
- Generates realistic French names
- Runs via `tsx apps/api/src/seed.ts`

### 2. Clear script

- **New:** `apps/api/src/clear.ts`
- Truncates all tables in correct order (FK dependencies)
- Runs via `tsx apps/api/src/clear.ts`

### 3. Package.json scripts

- **Modify:** `apps/api/package.json`
  - Add `"seed": "tsx src/seed.ts"`
  - Add `"seed:clear": "tsx src/clear.ts"`

### 4. Makefile commands

- **Modify:** `Makefile`
  - Add `seed` — runs `pnpm --filter @u-club/api seed`
  - Add `seed-clear` — runs `pnpm --filter @u-club/api seed:clear`
- **Modify:** `README.md` — document new commands

### 5. Env vars

- `SEED_ADMIN_EMAIL` (default: admin@u-club.app)
- `SEED_ADMIN_PASSWORD` (default: password123)
- `SEED_MANAGER_EMAIL` (default: manager@u-club.app)
- `SEED_MANAGER_PASSWORD` (default: password123)
- **Modify:** `.envrc.dist` — add these vars

## Files to create/modify

- `apps/api/src/seed.ts` (new)
- `apps/api/src/clear.ts` (new)
- `apps/api/package.json`
- `Makefile`
- `README.md`
- `.envrc.dist`

## Verification

1. `make seed` — verify data in DB
2. `make seed-clear` — verify all tables empty
3. Login as admin with configured credentials
4. Login as manager
5. Login as a seeded member user
