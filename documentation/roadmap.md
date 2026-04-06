# Roadmap

## Architecture & Data model

- **Club staff** — `club_users` join table to link users directly to clubs without being members (janitor, secretary, volunteer). Gives non-member users a club context.
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
- **Team chat link** — add `chat_link` field on teams for external group chat URLs (WhatsApp/Telegram)
- **In-app messaging** — WebSocket-based team/club messaging with stored history (future)
- **FFBB integration** — connect to FFBB APIs to import competition calendars, results, club/team data
  - Explore `ffbb-api-client-v2` Python client or build a Node equivalent
  - Import match schedules and results
  - Sync member licenses
- **Protected route wrapper (PWA)**
  — Redirect unauthenticated users on the React side instead of relying on API 401s

## Testing

- **E2e auth tests** — Cover email confirmation flow and role-based access denial in Playwright
- **Integration test suite** — Tests hitting a real test database to complement unit tests with mocks
- **Database seeding for tests** — Shared fixtures for consistent test data

## Developer experience

- **API client generation** — Auto-generate a typed API client from Swagger spec for the PWA

## PWA

- **One time password**
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
- **i18n** — Internationalization with react-i18next (French/English)
- **Loading/error states** — Add loading skeletons and error boundaries to pages
- **Pagination** — Cursor or offset pagination on list endpoints as data grows
