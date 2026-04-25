# 016 - 25/04/2026 - Admin Team Assignments Edition (PWA)

Add a "Team assignments" section to the admin member edit page that lets an admin/manager add, edit (role), and remove a member's team assignments. Round out the API with the two routes needed for this UX.

## Motivation

The DB has `team_assignments(id, team_id, member_id, role)` with `unique(team_id, member_id)` and the API exposes:

- `GET /teams/:teamId/members`
- `POST /teams/:teamId/members`
- `DELETE /teams/:teamId/members/:memberId`

That set is fine for "manage who's on this team". It doesn't cover the inverse flow we want here — "manage which teams this member is on, with what role" — so the PWA has no way to:

- list a member's assignments (with team name/role) without paginating every team.
- change a member's role on a team without delete + recreate (which makes the action feel destructive in the UI).

This plan adds the two missing API endpoints and builds the PWA UI to consume them, mounted under the existing member edit page next to "Family & members".

## Scope

### API — round out `team_assignments`

Two new routes, no migration changes.

#### `GET /members/:memberId/teams`

- Auth: `requireAuth` + `requireRole('admin', 'manager')`.
- Lists assignments for a single member, joined with `teams` so the PWA can render team metadata in one round-trip.
- Response shape (one row per assignment):
  ```ts
  {
      id: string;         // teamAssignments.id
      teamId: string;
      teamLabel: string;
      teamGender: 'female' | 'male' | 'mixed';
      teamCategoryLabel: string | null;
      role: 'player' | 'coach' | 'assistant' | 'sparring';
      createdAt: string;  // ISO
  }
  ```
- Order: `teams.label ASC` (deterministic, friendly).
- 200 with empty array when none — not paginated. Member assignments per person are bounded.
- 404 not used here (an empty list is the valid "none" answer); we only return 404 on `GET /members/:memberId` (already exists).

Files:
- `apps/api/src/routes/members/teams.ts` — new sub-router mounted on the existing `members` router (alongside the existing `members/list.ts`, `members/get.ts`, etc).
- `apps/api/src/routes/members/index.ts` — register the new sub-router.
- `apps/api/src/routes/members/members.test.ts` — extend with happy path, empty result, 401, 403, ordering.
- Swagger: add the new path block; existing `TeamAssignment` schema is fine for reference but the response is a denormalized DTO — define a `MemberTeamAssignment` schema next to it.
- Bruno: add `documentation/bruno/members/teams.bru` (sequence after the existing members files).

#### `PUT /teams/:teamId/members/:memberId`

- Auth: `requireAuth` + `requireRole('admin', 'manager')`.
- Body: `{ role }` (Zod-validated, same enum as create).
- 200 with the updated assignment row (`{ id, teamId, memberId, role, createdAt }`) on success.
- 404 when the assignment doesn't exist.
- 400 on missing/invalid role.

Files:
- `apps/api/src/routes/teams/assignments.ts` — extend the existing file with a `PUT /:memberId` handler.
- `apps/api/src/schemas/teamAssignment.ts` — add `updateTeamAssignmentSchema = z.object({ role: <enum> })` (the create schema also has `memberId`, so we can't reuse it).
- `apps/api/src/routes/teams/teams.test.ts` (or wherever the assignments tests live) — add 200 happy, 404 missing, 400 invalid role, 401/403 auth tests.
- Swagger: add the `PUT` block on `/teams/{teamId}/members/{memberId}` next to the existing `DELETE`.
- Bruno: add `documentation/bruno/teams/members-update.bru` (or extend an existing one).

### PWA — type + hooks

- `apps/pwa/src/types/MemberTeamAssignment.ts` — mirrors the GET response. Plus a `TeamRole` union and `TEAM_ROLE_OPTIONS` / `TEAM_ROLE_LABELS` lookups for the Select.
- `apps/pwa/src/hooks/useTeamAssignments.ts` — new file:
  - `useMemberTeamAssignments(memberId: string)` — `GET /api/members/:memberId/teams`. Query key `['team-assignments', { memberId, token }]`. `enabled: !!memberId`.
  - `useCreateTeamAssignment()` — `POST /api/teams/:teamId/members` with body `{ memberId, role }`. Invalidates `['team-assignments']` on success.
  - `useUpdateTeamAssignment()` — `PUT /api/teams/:teamId/members/:memberId` with body `{ role }`. Invalidates.
  - `useDeleteTeamAssignment()` — `DELETE /api/teams/:teamId/members/:memberId`. Invalidates.

### PWA — `MemberTeamAssignments` component

`apps/pwa/src/components/admin/team-assignments/MemberTeamAssignments.tsx`. Mirrors the structure of `UserMemberLinks` after PR #38 (single edit/add form open at a time, gated by an `editingId` state):

- Header `Group` with a `Title order={3}` "Team assignments" on the left and a primary `Button leftSection={<IconPlus />}` "Add" on the right.
- Loading: `Loader size="sm"`.
- Error: `Alert color="red"`.
- Empty: `Alert color="blue"` "No team assignments yet."
- `Table` columns: `# | Team | Role | actions`.
  - Team cell: bold team label (`Text size="sm" fw={700}`), then a dimmed `Text size="xs"` line for the category + gender (formatted via `TEAM_GENDER_LABELS`).
  - Role cell: human-readable role via `TEAM_ROLE_LABELS`.
  - Actions cell: right-aligned `ActionIcon size="sm"` for Edit (`IconEdit`) and Delete (`IconTrash`), with Tooltips matching the `UserMemberLinks` style.
- **Edit-in-place** (existing row): clicking Edit reveals an inline form row below the row with a single `Select` for `role`. Save/Cancel `ActionIcon`s (also `size="sm"`); Save disabled while not dirty.
- **Add-new**: the Add button opens an extra "ghost" form row at the bottom with `Team` Select + `Role` Select + Save/Cancel. The team Select is sourced from `useTeams({ itemsPerPage: 100 })` and excludes teams already assigned (filter client-side using current assignments).
- **Single-form gate**: when any edit/add form is open, clicking Edit or Add elsewhere shows an orange `notifications.show({ title: 'Another form is open', ... })` instead of switching — same pattern as `UserMemberLinks`.
- Save success → green notification; API errors (e.g. 409 duplicate) → red notification.
- Delete: `window.confirm`, then the delete mutation, then a green "Removed" notification.

### PWA — wire into `MemberFormPage`

Drop a new `FormWrapper` after the existing "Family & members" wrapper:

```tsx
<FormWrapper>
    <MemberTeamAssignments memberId={member?.id ?? ''} />
</FormWrapper>
```

Render only when `member?.id` is truthy (same gate the existing `UserMemberLinks` uses).

### Out of scope

- Reordering teams or roles within an assignment.
- Bulk assign / bulk role change.
- A "Member assignments" sub-section on the team edit page (the team page has its own member listing flow; that's not this PR).
- Any change to how assignments are surfaced in `MembersListPage` (the column on the list view stays as-is).

## Testing plan

### API

- **`GET /members/:memberId/teams`** — 200 happy (joined fields), 200 empty, 401, 403, ordering by `teams.label ASC`.
- **`PUT /teams/:teamId/members/:memberId`** — 200 happy, 400 invalid role, 400 missing role, 404 assignment missing, 401, 403.

### PWA — manual

- Member edit page: "Team assignments" section appears below "Family & members" with the existing assignments listed.
- Edit a row: Save updates the role, list reflects the new role with no re-fetch flicker (TanStack Query invalidate). Cancel reverts the inline editor. Save is disabled until dirty.
- Add: the team Select hides teams already assigned. Saving inserts the row and clears the add form. Picking a team that races with another tab returns a clear duplicate error toast (server-side 409).
- Delete: confirm prompt; on confirm the row disappears with a green toast.
- Single-form gate: opening Edit while Add is open (or vice versa) surfaces an orange "Another form is open" toast.

## Implementation steps

Each top-level section lands as a separate commit:

1. **API** — `GET /members/:memberId/teams` + `PUT /teams/:teamId/members/:memberId` + tests + swagger + Bruno.
2. **PWA hooks + type** — `MemberTeamAssignment.ts`, `useTeamAssignments.ts`.
3. **PWA component** — `MemberTeamAssignments.tsx` standalone (no integration yet).
4. **Wire-in** — mount the component in `MemberFormPage` under a new `FormWrapper`.
5. **Validation** — `pnpm lint`, `pnpm -r run test`, manual smoke.

## Open considerations

- **Update-role auth**: `admin` + `manager` (matches the existing assignments routes).
- **Cascade behavior**: deleting a team has `teams` referenced from `team_assignments` without `ON DELETE CASCADE`; that's not changed here. If it bites, add a follow-up plan.
- **Single-form pattern**: copy the gating from `UserMemberLinks` rather than abstracting yet — three rows of duplication is fine; abstract on the next caller.
- **Team picker source**: fetch via `useTeams({ itemsPerPage: 100 })` and filter client-side. Dataset is small in practice; if this gets large later, swap to a `searchable` Select or a server-backed combobox.
