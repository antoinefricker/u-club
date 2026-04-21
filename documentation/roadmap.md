# Roadmap

## Bugfixes

- [ ] Teams categories crud
- [ ] Member statuses crud
- [ ] Can't define team category in team create/update form
- [ ] Remove media column in club table
- [ ] Admin/members display birthdate, status / add search filter (last name, first name/ birthdate)
- [ ] Admin/member: (edit/create/show) define member status
- [ ] Admin/member: (edit/show) display relationships, invite CTA, pending invitations

## Architecture & Data model

- **Complex users**
  - users that are not members (parents or relative)
  - club_users` join table to link users directly to clubs without being members (janitor, secretary, volunteer). Gives non-member users a club context.
- **Create events entity**
  — core version
  - linked to a club or a team
  - columns:
    - label
    - date
    - place
  - out of scope
    - recurring events
    - events templates
- **Recurring events**
  — deal with weekly trainings
- **Events templates**
  — allow to define a list of events plugins associated with the event
  - player participation poll
  - coach player selection
  - volontary help poll with roles
  - additional dataset
  - display template
  - ...
  - each plugin will be implemented in a specific pull request
  - at first only implement the system
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
- **E2e registration & invitation tests** — Full registration flow (register → verify email → login) and invitation flow (send invite → accept → relationship created) in Playwright
- **Screenshot script** — Playwright script to take authenticated screenshots of PWA pages for PR descriptions
- **Integration test suite** — Tests hitting a real test database to complement unit tests with mocks
- **Database seeding for tests** — Shared fixtures for consistent test data

## Developer experience

- **API client generation** — Auto-generate a typed API client from Swagger spec for the PWA

## PWA

- documentation/bruno/ has no members/ or member-statuses/ directories, so those routes still lack Bruno coverage
- apps/pwa has no test framework, so usePagination / useListFilters rely on type safety + integration-level verification
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
- **i18n** — Internationalization with react-i18next (French/English)
- **Loading/error states** — Add loading skeletons and error boundaries to pages
- **Admin teams — category filter** — Add a category filter on `/admin/teams` (may require team_categories endpoints: list at minimum, possibly CRUD)
