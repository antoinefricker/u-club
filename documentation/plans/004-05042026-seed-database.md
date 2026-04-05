# Seed Database

## Context

We need a seed script to populate the dev database with realistic data for testing and development. Also need a clear command to wipe all data.

## Data to generate

- 1 admin user (email/password from `SEED_ADMIN_EMAIL` / `SEED_PASSWORD` env vars)
  define default value in .envrc.dist (admin@u-club.app / password123)
- 1 manager user (email/password from `SEED_MANAGER_EMAIL` / `SEED_PASSWORD` env vars)
  define default value in .envrc.dist (manager@u-club.app / password123)
- 4 member statuses (pending validation, active, inactive)
- 2 clubs
  - one club named CSG Baskin' have 3 teams in Senior age category, of both genders, named "Lions" and "Tigres"
  - other, named CSG have 24 teams (varied genders, age categories)
- name teams with pattern `<age_category> <first_letter_of_gender_or_empty_if_both> <number_of_teams_of_this_age_category_and_gender_index>`
- age categories are U7/U9/U11/U13/U15/U18/U21/Senior/Leisure
- age categories may have multiple teams
- between a random number of members between 18 and 28 per team
  - 80% of members get a linked user account (role: user, verified, password: SEED_PASSWORD)
  - Each team has 2 coaches, 2 assistants, the rest are players)
  - 20% of members belong to multiple teams
- before seeding ask user validation
- before clearing data
- seed scripts use

## Plan

### 1. Clear script

- **New:** `apps/api/src/seed-clear.ts`
- ask for user validation before launching script
- create a --force param to bypass user validation
- use @clack/prompts to display logs
- Truncates all tables in correct order (FK dependencies)
- Runs via `tsx apps/api/src/seed-clear.ts`

### 2. Seed script

- **New:** `apps/api/src/seed-create.ts`

- Uses existing `db.js` and `hashPassword` from `password.ts`
- ask for user validation before launching script
- create a --force param to bypass user validation
- launch seed-clear before creation (use force value to call it)
- use @faker-js to generate random values
- use @clack/prompts to display logs
- Runs via `tsx apps/api/src/seed-create.ts`

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
- `SEED_MANAGER_EMAIL` (default: manager@u-club.app)
- `SEED_PASSWORD` (default: password123)
- **Modify:** `.envrc.dist` — add these vars

## Files to create/modify

- `apps/api/src/seed-create.ts` (new)
- `apps/api/src/seed-clear.ts` (new)
- `apps/api/package.json`
- `Makefile`
- `README.md`
- `.envrc.dist`

## Verification

1. `make seed-create` — verify data in DB
2. `make seed-clear` — verify all tables empty
3. Login as admin with configured credentials
4. Login as manager
5. Login as a seeded member user
