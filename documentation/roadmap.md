# Roadmap

## Architecture

- [ ] **Create members** — Simple implementation a member is linked to a user and can belongs to multiple teams, have a role in a given team (player/coach/assistant/sparring)
- [ ] **Create events** — per team or club
- [ ] **Events model** — a to-do-list for each event
  - with categories of todos (availables/selected/referee/lunch/transport/table)
  - selectable in a date range
- [ ] **Seed database** —
  - 2 clubs, 45 teams, 25 members each / allow to clear
- [x] **Centralized error handling** — Add Express error middleware to return consistent JSON errors instead of HTML stack traces
- [ ] **Request validation library** — Adopt Zod for schema validation to replace inline checks in route handlers
- [ ] **Protected route wrapper (PWA)** — Redirect unauthenticated users on the React side instead of relying on API 401s

## Data model

- [ ] **User-club membership** — `club_members` join table (user_id, club_id, role) for per-club permissions
- [ ] **User-team assignment** — `team_members` table linking players/coaches to teams
- [ ] **Audit trail** — `created_by`/`updated_by` columns or a dedicated `audit_log` table

## Testing

- [ ] **E2e auth tests** — Cover email confirmation flow and role-based access denial in Playwright
- [ ] **Integration test suite** — Tests hitting a real test database to complement unit tests with mocks
- [ ] **Database seeding for tests** — Shared fixtures for consistent test data

## Developer experience

- [ ] **API client generation** — Auto-generate a typed API client from Swagger spec for the PWA
- [ ] **Database seeding script** — `make seed` command to populate dev data (admin user, sample club, teams)
- [ ] **Pre-commit hooks** — Husky + lint-staged to catch lint/format issues before CI

## PWA

- [ ] **A real PWA**
- [ ] **Club page**
  - events
  - teams
- [ ] **Team page**
  - events
  - members
  - todos
- [ ] **Calendar page**
  - filter by club
  - filter by date range
  - filter by team
  - export
- [ ] **Route guards** — Role-based UI: hide admin-only nav items from regular users
- [ ] **Loading/error states** — Add loading skeletons and error boundaries to pages
- [ ] **Pagination** — Cursor or offset pagination on list endpoints as data grows

# Roadmap

## Architecture

- [ ] **Create members** — Simple implementation a member is linked to a user and can belongs to multiple teams, have a role in a given team (player/coach/assistant/sparring)
- [ ] **Create events** — per team or club
- [ ] **Events model** — a to-do-list for each event
  - with categories of todos (availables/selected/referee/lunch/transport/table)
  - selectable in a date range
- [ ] **Seed database** —
  - 2 clubs, 45 teams, 25 members each / allow to clear
- [x] **Centralized error handling** — Add Express error middleware to return consistent JSON errors instead of HTML stack traces
- [ ] **Request validation library** — Adopt Zod for schema validation to replace inline checks in route handlers
- [ ] **Protected route wrapper (PWA)** — Redirect unauthenticated users on the React side instead of relying on API 401s

## Data model

- [ ] **User-club membership** — `club_members` join table (user_id, club_id, role) for per-club permissions
- [ ] **User-team assignment** — `team_members` table linking players/coaches to teams
- [ ] **Audit trail** — `created_by`/`updated_by` columns or a dedicated `audit_log` table

## Testing

- [ ] **E2e auth tests** — Cover email confirmation flow and role-based access denial in Playwright
- [ ] **Integration test suite** — Tests hitting a real test database to complement unit tests with mocks
- [ ] **Database seeding for tests** — Shared fixtures for consistent test data

## Developer experience

- [ ] **API client generation** — Auto-generate a typed API client from Swagger spec for the PWA
- [ ] **Database seeding script** — `make seed` command to populate dev data (admin user, sample club, teams)
- [ ] **Pre-commit hooks** — Husky + lint-staged to catch lint/format issues before CI

## PWA

- [ ] **A real PWA**
- [ ] **Club page**
  - events
  - teams
- [ ] **Team page**
  - events
  - members
  - todos
- [ ] **Calendar page**
  - filter by club
  - filter by date range
  - filter by team
  - export
- [ ] **Route guards** — Role-based UI: hide admin-only nav items from regular users
- [ ] **Loading/error states** — Add loading skeletons and error boundaries to pages
- [ ] **Pagination** — Cursor or offset pagination on list endpoints as data grows
