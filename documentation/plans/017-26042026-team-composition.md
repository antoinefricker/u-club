---
name: 017 - 26/04/2026 - Team Composition
description: Admin UI to compose a team's roster (add/edit/remove members with their role) on the team edit page, plus the missing CRUD endpoints on /team-assignments to back it.
---

# 017 - 26/04/2026 - Team Composition

Add an admin "Team composition" section under the team edit form (`TeamFormPage`) listing the members assigned to the team, with **Add / Edit role / Delete** actions. Back it with the missing write endpoints on the `/team-assignments` collection, and remove the now-dead nested `/teams/:teamId/members` routes that nothing else uses.

## Motivation

- Today the team edit page has no way to view, add, or change the members of a team — assignments can only be seeded or hit via Bruno.
- The pre-existing nested CRUD lives at `/teams/:teamId/members` (GET/POST/DELETE), but nothing in the PWA calls it and there's no `PUT` for changing a role. Last plan added `GET /team-assignments` as a flat resource collection — finishing that resource (POST/PUT/DELETE) gives one consistent surface mirroring the `/user-members` pattern, and lets us drop the dead nested routes.
- The team page should mirror the structure of the member page (second `<FormWrapper>` with a related-list table + actions).

## Scope

### Database — add `updated_at` to `team_assignments`

The table currently has only `created_at`. Adding `updated_at` brings it in line with `teams` / `members` / `users` / `clubs` and lets the new `PUT /team-assignments/:id` route stamp role changes.

- **Migration**: `apps/api/src/migrations/<next>_team_assignments_add_updated_at.ts`.
  - `up`: `table.timestamp('updated_at').defaultTo(knex.fn.now())`. Default backfills existing rows; for additional clarity, `UPDATE team_assignments SET updated_at = created_at` so existing rows reflect their actual modification time rather than the migration moment.
  - `down`: drop the column.
- **Update `documentation/database-diagram.mermaid`**: add `timestamp updated_at` under `TEAM_ASSIGNMENT` and show the diagram to the user (per CLAUDE.md).
- **API behavior**:
  - `update.ts` sets `updatedAt = new Date().toISOString()` on every PUT (mirrors `teams/update.ts`).
  - All `GET` / `POST` / `PUT` responses include `updatedAt` in the row shape.
- **PWA type**: extend `TeamAssignment` with `updatedAt: string`.

### API — add CRUD to `/team-assignments`

All three new routes: `requireAuth` + `requireRole('admin', 'manager')`. Mirror the `/user-members` route layout (one file per verb under `apps/api/src/routes/team-assignments/`).

#### `POST /team-assignments` — `apps/api/src/routes/team-assignments/create.ts`

- **Body** (Zod-validated): `{ teamId: uuid, memberId: uuid, role: 'player' | 'coach' | 'assistant' | 'sparring' }`.
- **Behavior**:
  - 404 when `teamId` or `memberId` does not exist (look up first → cleaner than relying on FK error).
  - 409 when `(teamId, memberId)` already exists (matches the existing nested route's behavior).
  - 201 with the inserted row enriched the same way as the GET row (joined team + member fields).
- **Schema reuse**: the existing `apps/api/src/schemas/teamAssignment.ts` defines `createTeamAssignmentSchema` for the nested route; extend or replace it with a flat-collection variant that includes `teamId`. (Prefer renaming the old to `nestedCreateTeamAssignmentSchema` only if we still needed it — we don't, so just rewrite it to include `teamId`.)

#### `PUT /team-assignments/:id` — `apps/api/src/routes/team-assignments/update.ts`

- **Body** (Zod-validated): `{ role: 'player' | 'coach' | 'assistant' | 'sparring' }` (only `role` is mutable; changing `teamId` or `memberId` is a delete+create).
- **Behavior**:
  - 404 when assignment id is missing.
  - 200 with the updated row in the same enriched shape as GET.

#### `DELETE /team-assignments/:id` — `apps/api/src/routes/team-assignments/delete.ts`

- 204 on success.
- 404 when missing.

#### Wiring

- `apps/api/src/routes/team-assignments/index.ts`: mount `create`, `update`, `delete` alongside the existing `list` router.
- Swagger (`apps/api/src/swagger.ts`):
  - New `CreateTeamAssignmentRequest` and `UpdateTeamAssignmentRequest` schemas.
  - Path blocks for the three new routes (the existing `TeamAssignmentRow` schema is reused for responses).

### API — delete the dead nested routes

- Delete `apps/api/src/routes/teams/assignments.ts`.
- Delete `apps/api/src/routes/teams/assignments.test.ts`.
- Remove `import assignmentsRouter` and `router.use('/:teamId/members', assignmentsRouter)` from `apps/api/src/routes/teams/index.ts`.
- The old `createTeamAssignmentSchema` in `apps/api/src/schemas/teamAssignment.ts` should be updated (not deleted) to include `teamId` for the new POST. If existing tests imported it from the schema file, they'll be deleted with the test file.

(Verified beforehand: no PWA hook, no Bruno collection, and only the route's own test references those nested paths.)

### API — tests

`apps/api/src/routes/team-assignments/team-assignments.test.ts` (extend the existing file): add new `describe` blocks for POST / PUT / DELETE.

- **POST**
  - 401 unauthenticated.
  - 403 regular user.
  - 400 missing `teamId` / `memberId` / `role`.
  - 400 invalid `role` enum value.
  - 404 when `teamId` doesn't exist.
  - 404 when `memberId` doesn't exist.
  - 409 when `(teamId, memberId)` already assigned.
  - 201 happy path: returns enriched row.
- **PUT**
  - 401 / 403 as above.
  - 400 missing or invalid `role`.
  - 404 when assignment id is missing.
  - 200 happy path: returns enriched row with new role.
- **DELETE**
  - 401 / 403 as above.
  - 404 when assignment id is missing.
  - 204 happy path.

### API — Bruno

- `documentation/bruno/team-assignments/create.bru` — POST with sample body.
- `documentation/bruno/team-assignments/update.bru` — PUT `:id` with `{ role }`.
- `documentation/bruno/team-assignments/delete.bru` — DELETE `:id`.

### PWA — extend `useTeamAssignments.ts`

Add three mutation hooks mirroring the `useUserMembers.ts` and `useTeamCategories.ts` shapes (using `useAuthHeaders` like other mutation hooks):

- `useCreateTeamAssignment()` — `POST /api/team-assignments`, invalidates `['team-assignments']`.
- `useUpdateTeamAssignment()` — `PUT /api/team-assignments/:id` with body `{ role }`, invalidates `['team-assignments']`.
- `useDeleteTeamAssignment()` — `DELETE /api/team-assignments/:id`, invalidates `['team-assignments']`.

### PWA — `TeamMembers` component

`apps/pwa/src/components/admin/team/TeamMembers.tsx`. Mirrors the look and interaction of `UserMemberLinks` but for the team↔members relation. Read-many + Add + per-row Edit (role) + Delete.

#### Layout

- **Header**: `<Group justify="space-between">` — empty left side (the section title lives in the parent `<FormWrapper>`), `Add member` button on the right.
- **Empty state**: `<Alert color="blue" variant="light">No members assigned yet.</Alert>` (still show the Add button).
- **Loading**: `<Loader size="sm" />`.
- **Error**: `<Alert color="red">Failed to load team members</Alert>`.
- **Populated**: Mantine `<Table>`:
  - Columns: `#` (24px), `Member` (~260px), `Role`, actions (~110px right-aligned).
  - Member cell: `Text size="sm" fw={700}` `${firstName} ${lastName}`.
  - Role cell:
    - **Display mode**: `Text size="sm"` from `TEAM_ROLE_LABELS[role]`.
    - **Edit mode**: a `Select` over `TEAM_ROLE_OPTIONS` (new export in `types/TeamAssignment.ts`).
  - Actions cell: per-row `ActionIcon`s — `Edit` (pencil), `Delete` (trash). When editing: replace with `Cancel` (X) and `Save` (check), `Save` disabled until role changes (mirrors the dirty check in `UserMemberLinks`).

#### Add member modal

`apps/pwa/src/components/admin/team/AddTeamMemberModal.tsx`:

- Mantine `<Modal title="Add member to team">`.
- **Member picker**: searchable Select using `useMembers({ search, itemsPerPage: 50 })`. **No client-side filter on already-assigned members** — they remain selectable; the API 409 surfaces inline.
- **Role select**: standard Select over `TEAM_ROLE_OPTIONS`, **no default value**. Placeholder reads "Select a role".
- **Submit** is disabled until both a member *and* a role are selected.
- **Submit** → `useCreateTeamAssignment()` → 201 → `notifications.show` + close modal.
- **Error**: surface 404/409 as a red `<Alert>` inside the modal (e.g. "This member is already on the team").

#### Props

```ts
interface TeamMembersProps {
    teamId: string;
}
```

Internally fetches via `useTeamAssignments({ memberId: undefined, userId: undefined, /* but with a teamId filter */ })` — see "API caveat" below.

#### API caveat — filtering by `teamId`

The `GET /team-assignments` route shipped last PR doesn't yet support a `teamId` filter (it only filters by `userId` / `memberId`). Two options:

- **(A) Extend the GET route** to accept `teamId?: uuid` (admin/manager only, mutually exclusive with `userId`/`memberId`). Tiny change; test it the same way as the existing filters.
- **(B) Filter client-side** by fetching `?itemsPerPage=100` and post-filtering. Lazy and bad for teams with many members across the system.

Plan goes with **(A)**. Add the filter, a 400 case for "all three filters together", and an extra happy-path test.

### PWA — wire into `TeamFormPage`

`apps/pwa/src/pages/admin/TeamFormPage.tsx`: add a second `<FormWrapper>` after the main form, gated on `team?.id` (same as `MemberFormPage` does for `member?.id`):

```tsx
<FormWrapper>
    <Title order={3} mt="xl" mb="md">
        Team composition
    </Title>
    {team?.id && <TeamMembers teamId={team.id} />}
</FormWrapper>
```

(The section is hidden in "create" mode where there's no team id yet.)

### PWA — types

`apps/pwa/src/types/TeamAssignment.ts`: add `TEAM_ROLE_OPTIONS` (mirroring `TEAM_GENDER_OPTIONS`):

```ts
export const TEAM_ROLE_OPTIONS: { value: TeamRole; label: string }[] = (
    Object.keys(TEAM_ROLE_LABELS) as TeamRole[]
).map((value) => ({ value, label: TEAM_ROLE_LABELS[value] }));
```

### Out of scope

- **Bulk operations**: no multi-select / batch role change.
- **Reordering**: assignments stay ordered by creation time (no manual sort / position).
- **Player/coach grouping**: a single flat list ordered by creation time. If grouping by role is wanted later, do it as a v2 enhancement.
- **Assignment created/updated audit fields**: only `createdAt` exists on the schema today; not adding `updatedAt`.

## Testing plan

### API — see "API — tests" above.

### PWA — manual

- On a team with no members: empty alert + Add button visible.
- Click `Add member` → modal opens → search returns matching members → pick a member + role → submit → row appears in the list, modal closes, success toast.
- Adding the same member twice (after closing/reopening modal): the duplicate is filtered out of the picker; if forced, the API 409 surfaces as an alert inside the modal.
- Edit a row: pencil icon → role cell becomes Select → change role → Save → toast + table reflects new role.
- Edit row: Cancel reverts.
- Delete a row: trash icon → window.confirm → on confirm row disappears + toast.
- The "Team assignments" section on `/account` (shipped in PR #41) still works after the route refactor.
- Team list / team form / team category pages unaffected.

## Implementation steps

Each top-level section gets its own commit (per CLAUDE.md):

1. **DB — migration** adding `updated_at` to `team_assignments` + diagram update.
2. **API — extend `GET /team-assignments` with `teamId` filter** + return `updatedAt` + tests.
3. **API — `POST /team-assignments`**: route, schema, swagger, tests.
4. **API — `PUT /team-assignments/:id`**: route, swagger, tests.
5. **API — `DELETE /team-assignments/:id`**: route, swagger, tests.
6. **API — delete the nested `/teams/:teamId/members` routes** (file + test + index unmount).
7. **API — Bruno**: `create.bru`, `update.bru`, `delete.bru`.
8. **PWA — types & hooks**: `TEAM_ROLE_OPTIONS`, `updatedAt` on type + `useCreate/Update/DeleteTeamAssignment`.
9. **PWA — `TeamMembers` + `AddTeamMemberModal`** components.
10. **PWA — wire `TeamMembers` into `TeamFormPage`**.
11. **Validation**: `pnpm lint`, `pnpm -r run test`, manual smoke.

## Resolved decisions

1. **Add UX**: modal (matches `InviteUserButton`'s pattern). ✅
2. **Picker filter**: do **not** filter out already-assigned members — show all; let the API 409 surface inline. ✅
3. **Default role on Add**: **none** — submit is gated on the user explicitly picking a role. ✅
4. **`updatedAt` on assignments**: **add** via a new migration; updated by the new PUT route. ✅
