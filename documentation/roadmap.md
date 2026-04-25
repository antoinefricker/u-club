# Roadmap

## Prioritized

### 1. ~~Rearrange PWA folders structure~~

- [x] create a `components` folder to locate reusable components
- [x] extract resource/domain types and constants to types folder
- [x] general boyscouting

### 2. Admin

- [x] Add link to edition page on all resource label from list view
- [ ] Member list
  - [x] Fix search filter UI
  - [ ] Show member related team assignements
  - [ ] Create/Edit/Delete member team assignements
  - [x] Show member relationships
  - [x] Edit/delete member relationships
  - [x] Send invite
  - [ ] Show member pending invitations
- [ ] Create/Edit/Delete member Member statuses

### 3. User

- [x] Remove my clubs page
- [x] Remove my teams page
- [ ] Implement dashboard
  - [ ] Show self team assignements
  - [ ] Show self relationships
  - [ ] Show pending invitations
- [ ] Team page
  - [ ] Info
  - [ ] Members and roles
  - [ ] Add one entry per team in the menu
  - [ ] Add links to teams pages in user dashboard

### 4. Events

- [ ] Events CRUD
  - [ ] linked to a club or a team
  - [ ] columns: label/date/place/visibility(team/relationships/...)
  - out of scope: recurring events and events templates
- [ ] Timeline display
- [ ] Teams filters
- [ ] Relationships filters
- [ ] Add events preview in team page
- [ ] Add events preview in dashboard

### 5. Pages

- [ ] Create page entity and CRUD
- [ ] Create section entity and CRUD
- [ ] Markdown editor
  - [ ] typography
  - [ ] separator
  - [ ] download link
  - [ ] grid

### 6. Media library

- [ ] CRUD images
- [ ] CRUD files
- [ ] insert image in markdown

### 7. Publication

- [ ] Internationalization with react-i18next (French/English)
- [ ] Production env

## Later features

### Architecture & Data model

- **Complex users**
  - users that are not members (parents or relative)
  - club_users` join table to link users directly to clubs without being members (janitor, secretary, volunteer). Gives non-member users a club context.
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

### Testing & documentation

- documentation/bruno/ has no members/ or member-statuses/ directories, so those routes still lack Bruno coverage
- **E2e auth tests** — Cover email confirmation flow and role-based access denial in Playwright
- **E2e registration & invitation tests** — Full registration flow (register → verify email → login) and invitation flow (send invite → accept → relationship created) in Playwright
- **Screenshot script** — Playwright script to take authenticated screenshots of PWA pages for PR descriptions
- **Integration test suite** — Tests hitting a real test database to complement unit tests with mocks
- **Database seeding for tests** — Shared fixtures for consistent test data

### PWA

- apps/pwa has no test framework, so usePagination / useListFilters rely on type safety + integration-level verification
- **One time password**
- **PWA polish**
  - app icons (192x192, 512x512)
  - offline fallback page
  - theme color / splash screen
  - push notifications
- **Calendar page**
  - filter by club
  - filter by date range
  - filter by team
  - export
- **i18n** — Internationalization with react-i18next (French/English)
- **Loading/error states** — Add loading skeletons and error boundaries to pages
