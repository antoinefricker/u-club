# Plan 019 — Team Assignment Multiple Roles

Allow a member to hold several different roles on the same team (e.g. *coach* and *player*) by treating each `(team, member, role)` triple as its own row. Drop the `PUT /team-assignments/:id` update flow — with multi-role, role changes happen through add + remove, so a single-row PATCH is no longer the right primitive.

## Current state

- `team_assignments` enforces `UNIQUE(team_id, member_id)` — a member can only hold one role per team.
- `POST /team-assignments` 409s on `(teamId, memberId)` collision.
- `PUT /team-assignments/:id` updates an assignment's `role` (and optionally `teamId`); the PWA exposes this as an inline edit-in-place row in `TeamMembers` and `UserTeamAssignments`.
- `useUpdateTeamAssignment` in the PWA wraps the PUT call.

## Target behavior

- A member can have multiple distinct roles on a team. The same role cannot be assigned twice (`(team_id, member_id, role)` is unique).
- Role changes are modelled as add + remove (no in-place update). The `PUT` route, its schema, tests, OpenAPI, Bruno file, and PWA hook are removed.
- The list endpoints already return one row per assignment, so multi-role surfaces naturally in `TeamMembers` (rows per assignment, member name repeats) and `UserTeamAssignments` (rows per assignment, team name repeats). No grouping work required up front.
- The `Add member` / `Assign to team` modals filter out roles the member already holds on the target team so the user can't pick a role that would 409.

## Out of scope

- Visual grouping/collapsing of multiple-role members under one row (e.g. role chips). Easy follow-up if the unrolled list becomes noisy in practice.
- Backfill / data migration — the existing unique constraint is *more permissive* under the new shape, so existing rows transparently satisfy the new constraint.

---

## 1. Database migration + diagram

- New migration `apps/api/src/migrations/<timestamp>_team_assignments_unique_team_member_role.ts`:
    - `up`: drop the existing `team_assignments_team_id_member_id_unique` index, add `UNIQUE(team_id, member_id, role)`.
    - `down`: reverse — drop the triple unique, restore the pair unique. (Note: down would fail if any member already holds multiple roles; documented in the migration comment.)
- Update `documentation/database-diagram.mermaid`: annotate `TEAM_ASSIGNMENT` so the `(team_id, member_id, role)` uniqueness is visible (Mermaid ER doesn't support composite UK syntax cleanly — add it as a comment line above the block).
- Show the updated diagram to the user.

**Commit:** `feat(db): allow multiple roles per (team, member) in team_assignments`

## 2. API — drop the update route

- Delete `apps/api/src/routes/team-assignments/update.ts`.
- Remove its registration from `apps/api/src/routes/team-assignments/index.ts`.
- Remove `updateTeamAssignmentSchema` from `apps/api/src/schemas/teamAssignment.ts` and any corresponding type/export.
- Remove the `UpdateTeamAssignmentRequest` schema from `apps/api/src/swagger.ts`.
- Delete `documentation/bruno/team-assignments/update.bru`.

**Commit:** `refactor(api): remove PUT /team-assignments/:id`

## 3. API — relax the create-collision check + sync OpenAPI/Bruno

- In `apps/api/src/routes/team-assignments/create.ts`, change the 409 lookup from `where({ teamId, memberId })` to `where({ teamId, memberId, role })` so duplicates are detected per-role only.
- Update the `@openapi` annotation: the 409 description becomes `Member already has this role on this team`.
- Update `documentation/bruno/team-assignments/create.bru` if its example/comment mentions the old uniqueness rule.

**Commit:** `feat(api): allow members to hold multiple distinct roles per team`

## 4. API tests

Per CLAUDE.md API workflow:

1. **Suggest tests** to the user before writing them. Cover at minimum:
    - `POST` with a `(team, member, role)` triple where the member already has a *different* role on the team → **201** (was 409 before).
    - `POST` with the *same* `(team, member, role)` triple → **409 Conflict** with the new message.
    - `POST` with a `(team, member, role)` triple where the member is new to the team → **201** (regression).
    - List endpoint returns multiple rows for the same `(team, member)` when multiple roles exist.
    - Removed update tests.
2. **Ask the user for additional edge cases.**
3. Write the tests (use `vi.resetAllMocks()` per CLAUDE.md guidance; UUID JWT subjects).
4. Delete the now-obsolete update test block from `team-assignments.test.ts`.

**Commit:** `test(api): cover multi-role team assignments`

## 5. PWA — drop the role-edit affordance

- `apps/pwa/src/components/admin/team/TeamMembers.tsx`:
    - Remove the `editingId` / `editedRole` state, the `startEdit` / `cancelEdit` / `saveEdit` flow, and the inline `Select`.
    - Keep delete-only — each row stays as a flat `(member, role)` pair with a `Trash` action.
    - Drop the `IconEdit`, `IconCheck`, `IconX` imports and the `useUpdateTeamAssignment` import.
- `apps/pwa/src/components/admin/user/UserTeamAssignments.tsx`: same changes.
- Delete the `useUpdateTeamAssignment` hook from `apps/pwa/src/hooks/useTeamAssignments.ts`.

**Commit:** `refactor(pwa): replace inline role edit with delete-only on team assignments`

## 6. PWA — filter already-held roles in add modals

- `apps/pwa/src/components/admin/team/AddTeamMemberModal.tsx` (or wherever the team-side add lives):
    - When a member is selected, look up that member's existing roles on the current team (from the already-loaded assignments list) and filter `TEAM_ROLE_OPTIONS` to omit them.
    - If every role is already held, disable the role select and show a hint.
- `apps/pwa/src/components/admin/user/AssignToTeamButton.tsx`'s modal:
    - When a team is selected, filter `TEAM_ROLE_OPTIONS` to omit roles already held by this member on that team.
    - Same disable + hint when all roles are taken.
- Both surfaces should still gracefully handle a 409 from the API as a defensive fallback (notification, don't crash).

**Commit:** `feat(pwa): filter unavailable roles in team-assignment add modals`

## 7. Roadmap update

- Tick the relevant entry off `documentation/roadmap.md`.

**Commit:** `docs: tick off team assignment multiple roles in roadmap`
