# Roadmap

## Architecture & Data model

- **Complex users**
  - users that are not members (parents or relative)
- **Create events entity**
  — core version
  - linked to a club or a team
  - columns:
    - label
    - date
    - place
  - out of scope: recurring events, events models
- **Recurring events**
  — deal with weekly trainings
- **Events model**
  — a to-do-list for each event
  - with categories of todos (availables/selected/referee/lunch/transport/table)
  - selectable in a date range
- **Event announcements** — publishable posts linked to events, shared with club/team members
- **Seed database**
  - 2 clubs
  - 45 teams in each club
  - 25 members each
  - related user
  - admin
  - allow to clear all data
- **Team chat link** — add `chat_link` field on teams for external group chat URLs (WhatsApp/Telegram)
- **In-app messaging** — WebSocket-based team/club messaging with stored history (future)
- **Protected route wrapper (PWA)**
  — Redirect unauthenticated users on the React side instead of relying on API 401s

## Testing

- **E2e auth tests** — Cover email confirmation flow and role-based access denial in Playwright
- **Integration test suite** — Tests hitting a real test database to complement unit tests with mocks
- **Database seeding for tests** — Shared fixtures for consistent test data

## Developer experience

- **API client generation** — Auto-generate a typed API client from Swagger spec for the PWA
- **Database seeding script** — `make seed` command to populate dev data (admin user, sample club, teams)

## PWA

- **Lost password**
- **One timepassword**
- **PWA polish**
  - app icons (192x192, 512x512)
  - offline fallback page
  - theme color / splash screen
  - push notifications
- **Club page**
  - events
  - teams
- **Team page**
  - events
  - members
  - todos
- **Calendar page**
  - filter by club
  - filter by date range
  - filter by team
  - export
- **Admin pages**
  - clubs management (CRUD)
  - teams management (CRUD)
  - members management (CRUD)
- **Route guards** — Role-based UI: hide admin-only nav items from regular users
- **Loading/error states** — Add loading skeletons and error boundaries to pages
- **Pagination** — Cursor or offset pagination on list endpoints as data grows
