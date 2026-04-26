---
name: 016 - 26/04/2026 - Team Assignments Account Section
description: Add a "Team assignments" section on the user's AccountPage listing teams the user is assigned to via their linked members, mirroring the "Family & members" table pattern.
---

# 016 - 26/04/2026 - Team Assignments Account Section

Add a third section on `AccountPage` titled **"Team assignments"** that lists the teams the current user is assigned to, joined through their linked members. The section reuses the table-based display pattern of `UserMemberLinks` (the existing "Family & members" section).

## Motivation

A user is linked to one or more `members` (themselves and/or relatives). Each member can have one or more `team_assignments`. Today, none of this is visible on the user's account page — the user has no way to see "which teams am I (or my family) assigned to?". The data exists in the database but is only exposed via `GET /teams/:teamId/members` (team-side, admin/manager only).

## Scope

### API — new endpoint `GET /team-assignments`

A top-level, query-filterable, paginated list, mirroring the `/user-members` convention rather than the team-nested `/teams/:teamId/members` route.

- **File**
  - `apps/api/src/routes/team-assignments/list.ts` — new.
  - `apps/api/src/routes/team-assignments/index.ts` — new (mounts `list`).
  - `apps/api/src/app.ts` — register `app.use('/team-assignments', teamAssignmentsRouter)`.
  - `apps/api/src/routes/team-assignments/team-assignments.test.ts` — new.
- **Auth**
  - `requireAuth` only (no `requireRole`). Authorization is enforced by the `userId` filter:
    - If neither `userId` nor `memberId` is provided → respond with the *current user's* assignments (server forces `userId = req.user.id`).
    - If `userId` is provided and the caller is not admin/manager → 403 unless `userId === req.user.id`.
    - If `memberId` is provided and the caller is not admin/manager → 403 unless the member is linked to the caller via `userMembers`.
  - This mirrors how `useUserMembers` falls back to the current user.
- **Query params** (Zod-validated):
  - `userId?: uuid` — filter assignments to members linked to this user.
  - `memberId?: uuid` — filter assignments to a single member.
  - `page`, `itemsPerPage` — standard pagination (`paginationQuerySchema`).
- **Response envelope**: `{ data, pagination }` per project convention.
- **Row shape** (joined for display use):
  ```ts
  {
    id: string;            // team_assignments.id
    teamId: string;
    teamLabel: string;
    teamGender: 'male' | 'female' | 'mixed';
    teamCategoryLabel: string | null;
    memberId: string;
    memberFirstName: string;
    memberLastName: string;
    role: 'player' | 'coach' | 'assistant' | 'sparring';
    createdAt: string;
  }
  ```
- **Ordering**: `ORDER BY teamAssignments.createdAt DESC, teamAssignments.id ASC` (deterministic).
- **Swagger** (`apps/api/src/swagger.ts`):
  - Add `TeamAssignmentRow` schema for the enriched row.
  - Add the path block for `GET /team-assignments`.
- **Bruno** (`documentation/bruno/team-assignments/list.bru`): new collection folder with the list request.

### API — tests

`apps/api/src/routes/team-assignments/team-assignments.test.ts` covers:

- 200 happy path: defaults to current user — returns paginated rows joined with team and member.
- 200 with `memberId` filter when caller owns the member.
- 200 with `userId === self` (no admin role required).
- 200 admin/manager with arbitrary `userId` or `memberId`.
- 403 when a regular user passes another user's `userId`.
- 403 when a regular user passes a `memberId` not linked to them.
- 400 on invalid uuid / invalid pagination.
- 401 unauthenticated.

### PWA — type

`apps/pwa/src/types/TeamAssignment.ts`:

```ts
export type TeamRole = 'player' | 'coach' | 'assistant' | 'sparring';

export interface TeamAssignment {
    id: string;
    teamId: string;
    teamLabel: string;
    teamGender: 'male' | 'female' | 'mixed';
    teamCategoryLabel: string | null;
    memberId: string;
    memberFirstName: string;
    memberLastName: string;
    role: TeamRole;
    createdAt: string;
}

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
    player: 'Player',
    coach: 'Coach',
    assistant: 'Assistant',
    sparring: 'Sparring',
};
```

### PWA — hook

`apps/pwa/src/hooks/useTeamAssignments.ts` mirroring `useUserMembers`:

- `useTeamAssignments({ page?, itemsPerPage?, userId?, memberId? })`
- Defaults `userId` to the current user's id when neither `userId` nor `memberId` is provided (same fallback `useUserMembers` uses).
- `placeholderData: keepPreviousData`, query key `['team-assignments', { page, itemsPerPage, userId, memberId, token }]`.
- Returns `Paginated<TeamAssignment>`.

No mutation hooks in this plan — see "Out of scope".

### PWA — `UserTeamAssignments` component

`apps/pwa/src/components/admin/user/UserTeamAssignments.tsx` — read-only sibling of `UserMemberLinks`.

- Accepts `{ userId?, memberId? }` (same shape).
- Loading: `<Loader size="sm" />`.
- Error: `<Alert color="red">Failed to load team assignments</Alert>`.
- Empty: `<Alert color="blue">No team assignments yet.</Alert>` (text adjusts when `memberId` is set: "No teams for this member.").
- Otherwise: a Mantine `<Table>` matching the `UserMemberLinks` look:
  - `Thead`: `#`, `Team`, `Member`, `Role`.
  - `Tbody` rows:
    - **#** — index (dimmed `xs`).
    - **Team** — `Text size="sm" fw={700}` with the team label, plus `Text size="xs" c="dimmed"` showing `categoryLabel` (or gender label) underneath.
    - **Member** — `${memberFirstName} ${memberLastName}` (`size="sm"`).
    - **Role** — `TEAM_ROLE_LABELS[role]`.
- No actions column for now (read-only).

### PWA — wire into `AccountPage`

`apps/pwa/src/pages/AccountPage.tsx`: add a third `<FormWrapper>` after "Family & members":

```tsx
<FormWrapper>
    <Title order={3} mt="xl" mb="md">
        Team assignments
    </Title>
    <UserTeamAssignments />
</FormWrapper>
```

No props — the component falls back to `userId = current user`.

### Out of scope

- **Mutations from the account page**: no add / remove / change-role from the user-facing page. Team assignment changes remain admin/manager via `POST/DELETE /teams/:teamId/members`. Open question below.
- **Admin reuse**: not adding a `<UserTeamAssignments memberId=...>` to the admin `MemberFormPage`. The component is built to support that wiring later, but plumbing it into the admin form is a separate task.
- **Pagination UI**: the section will request a single page (e.g. `itemsPerPage=100`) and not show paginator controls in v1. A typical user has only a handful of assignments. Revisit if it becomes painful.
- **Filtering / search** within the section.
- **Linking the team label to a team detail page** (no user-facing team page exists yet).

## Testing plan

### API

- See "API — tests" above.

### PWA — manual

- Logged in as a user with linked members who have team assignments: the new section lists each `(team, member, role)` row.
- Logged in as a user with no team assignments: shows the empty alert.
- Logged in as a user whose only linked member has no team assignment: shows the empty alert.
- Section visually mirrors "Family & members" (same `FormWrapper`, same `Title` style, same Table density).
- Reload preserves the data (cached via React Query).

## Implementation steps

Each top-level section gets its own commit (per CLAUDE.md):

1. **API — `GET /team-assignments` route** (route file, register, swagger).
2. **API — tests** for `GET /team-assignments`.
3. **API — Bruno**: `documentation/bruno/team-assignments/list.bru`.
4. **PWA — type**: `apps/pwa/src/types/TeamAssignment.ts`.
5. **PWA — hook**: `apps/pwa/src/hooks/useTeamAssignments.ts`.
6. **PWA — component**: `apps/pwa/src/components/admin/user/UserTeamAssignments.tsx`.
7. **PWA — `AccountPage` wiring**: add the third `<FormWrapper>` section.
8. **Validation**: `pnpm lint`, `pnpm -r run test`, manual smoke.

## Open considerations

1. **Read-only vs editable**: the request says "use the same list display pattern" — does that include the per-row Edit / Delete actions present in `UserMemberLinks`? My read is *display only* (so: same table shape, no action buttons), since assignment changes are an admin function. Confirm before step 6.
2. **Endpoint shape**: I went with a flat `/team-assignments?userId=...&memberId=...` collection over `/members/:memberId/teams` because (a) the user POV needs to span multiple members in one query and (b) `/user-members?userId=...` already established the precedent. Flag if you'd prefer the nested form.
3. **Default page size**: `itemsPerPage=100` for the account section is loud but matches what `UserMemberLinks` does. Open to a smaller cap if you want explicit pagination instead.
