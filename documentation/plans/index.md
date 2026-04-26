# Plans

- [001 - 05/04/2026 - User Roles](001-05042026-user-roles.md) — Global user roles (admin, manager, user) with auth and authorization middleware
- [002 - 05/04/2026 - Members](002-05042026-members.md) — Members entity with team assignments and roles
- [003 - 05/04/2026 - Zod Validation](003-05042026-zod-validation.md) — Replace inline validation with Zod schemas
- [004 - 05/04/2026 - Seed Database](004-05042026-seed-database.md) — Seed script with realistic dev data and clear command
- [005 - 05/04/2026 - Lost Password](005-05042026-lost-password.md) — Password reset flow via email
- [006 - 06/04/2026 - Users-Members Relationship](006-06042026-users-members-relationship.md) — Many-to-many user-member links with custom descriptions
- [007 - 06/04/2026 - Admin Pages](007-06042026-admin-pages.md) — Admin CRUD pages for clubs, teams, and members
- [008 - 21/04/2026 - Case Hell](008-21042026-case-hell.md) — Unify on camelCase app-side via Knex mappers; delete the HTTP caseConverter middleware
- [009 - 21/04/2026 - Test Coverage](009-21042026-test-coverage.md) — Install v8 coverage, fill middleware/schema/util test gaps, deepen thin auth tests
- [010 - 21/04/2026 - Handle Pagination](010-21042026-handle-pagination.md) — Offset-based pagination on every API list route + Mantine/TanStack Query wiring in the PWA
- [011 - 22/04/2026 - Team Categories CRUD](011-22042026-team-categories-crud.md) — Full CRUD API for team_categories + categoryId Select in the team create/edit form
- [012 - 22/04/2026 - Admin Members Search](012-22042026-admin-members-search.md) — Free-text search on admin members list over first name, last name, and DD/MM/YYYY birthdate
- [013 - 24/04/2026 - Show & Edit Member Relationships](013-24042026-show-edit-member-relationships.md) — Scope `UserRelationships` by `memberId` (admin/manager) with flipped user-side labels + API `GET /user-members?memberId=…`
- [014 - 24/04/2026 - Invite User Button](014-24042026-invite-user-button.md) — Admin member-form modal posting to `POST /invitations` + shared `createEmailToken` helper + public token-gated `GET /invitations/by-token/:token` and `register-and-accept` routes so invited users can register and accept in one form without separate email verification
- [015 - 25/04/2026 - Member Statuses Admin CRUD](015-25042026-member-statuses-admin-crud.md) — PWA admin list + form pages for `member_statuses` (create/edit/delete) plus the missing `GET /member-statuses/:id` API route
- [016 - 26/04/2026 - Team Assignments Account Section](016-26042026-team-assignments-account-section.md) — Read-only "Team assignments" section on `AccountPage`, listing teams the user is assigned to via their linked members, backed by a new `GET /team-assignments` API route
- [017 - 26/04/2026 - Team Composition](017-26042026-team-composition.md) — Admin "Team composition" section on `TeamFormPage` (add/edit-role/remove members), full CRUD on `/team-assignments`, deletes the dead nested `/teams/:teamId/members` routes
- [018 - 26/04/2026 - Pending Invitations](018-26042026-pending-invitations.md) — "Pending invitations" section on `MemberFormPage` (read + cancel) backed by extending `GET /invitations` to require `userId` or `memberId`
