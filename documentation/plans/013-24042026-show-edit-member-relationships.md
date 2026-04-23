# 013 - 24/04/2026 - Show & Edit Member Relationships

Extend the existing `UserRelationships` component so it can be scoped by `memberId` in addition to `userId`. When scoped by member, it lists the users linked to that member and lets an admin/manager edit or remove those links.

## Motivation

`apps/pwa/src/pages/admin/MemberFormPage.tsx` already renders `<UserRelationships memberId={member?.id} />`, but the component only accepts a `userId` prop — `memberId` is silently ignored and the query is disabled because `userId` is undefined. So the admin member form has a "Relationships" section today that renders nothing useful.

The symmetric view (for a member, who are the users?) is needed for admins to audit and fix bad links (e.g. wrong parent attached to a child).

## Scope

### API — extend `GET /user-members`

- **File**: `apps/api/src/routes/user-members/list.ts`
- **New query param**: `?memberId=<uuid>`, optional.
  - Zod validation: add a Zod schema on top of the existing `paginationQuerySchema` that accepts `userId?: string().uuid()` and `memberId?: string().uuid()` and rejects both being set at once (400 with a clear message).
  - **Privilege**: `memberId` is admin/manager-only. A regular user who passes `memberId` is ignored (consistent with how the existing `userId` filter is ignored for regular users).
- **Query changes**:
  - Add a `join` to `users` so we can return the user's identifying fields on each row: `users.displayName as userDisplayName`, `users.email as userEmail`. (The `users` table has a single `display_name`, not first/last.)
  - When `memberId` is provided (and caller is privileged), filter with `query.where('userMembers.memberId', memberId)`.
  - `userId` and `memberId` are mutually exclusive — enforced above in validation, so the branches don't need to be combined.
- **OpenAPI annotation**: add the new `memberId` query param; document the mutual-exclusion 400; extend the `UserMember` response schema with `memberFirstName`, `memberLastName`, `userDisplayName`, `userEmail` (the existing schema doesn't include the joined member fields either; add them all).
- **Bruno** `documentation/bruno/user-members/list.bru` — add `~memberId:` under `params:query`.

### PWA — `useUserMembers` hook

- **File**: `apps/pwa/src/hooks/useUserMembers.ts`
- Extend `UseUserMembersArgs` with optional `memberId?: string`.
- Keep the existing `userId ?? user?.id` fallback behavior, but ONLY when `memberId` is not set — if the caller passes `memberId`, do not also default `userId` to the current user (that would produce the mutual-exclusion 400 from the API).
- `buildListQueryString` already forwards arbitrary string keys — just add `memberId` to the object passed in.
- Include `memberId` in the query key: `['user-members', { page, itemsPerPage, userId, memberId }]`.
- `enabled`: true when either `userId` or `memberId` is truthy (today it's `!!userId`).

### PWA — domain type

- **File**: `apps/pwa/src/types/UserMember.ts`
- Add `userDisplayName: string`, `userEmail: string` to the `UserMember` interface so the component can render the user side.

### PWA — `UserRelationships` component

- **File**: `apps/pwa/src/components/admin/user/UserRelationships.tsx`
- **Props**: `{ userId?: string; memberId?: string }`. Exactly one should be provided; if both are passed, throw in development (simple guard — `console.warn` + render nothing). Rationale: the API rejects the combination, so guarding client-side makes the bug loud.
- **Mode derivation**: `const mode = memberId ? 'member' : 'user'`.
- **Pass-through to hook**: `useUserMembers({ itemsPerPage: 100, userId, memberId })`.
- **Rendering — labels flip based on mode**:
  - Header "Member" column → "User" in `member` mode.
  - Row primary cell:
    - `user` mode (today): `{rel.memberFirstName} {rel.memberLastName}`.
    - `member` mode: `{rel.userDisplayName}` with the email on a second line in dimmed text for disambiguation.
  - Type `Select` options:
    - `user` mode (today): `{ value: 'self', label: "It's me!" }`, `{ value: 'relative', label: "It's a relative" }`.
    - `member` mode: `{ value: 'self', label: "This is them" }`, `{ value: 'relative', label: "This is a relative" }`.
  - Description prefix line (the "I am {memberFirstName}'s" text):
    - `user` mode (today): `I am {rel.memberFirstName}'s`.
    - `member` mode: `They are {rel.userDisplayName}'s`.
  - Empty state copy:
    - `user` mode (today): `No linked members yet.`
    - `member` mode: `No linked users yet.`
- **Edit/delete behavior**: unchanged — the PUT/DELETE endpoints operate on the `userMembers.id` which is the same regardless of which side we're viewing from.

### Out of scope

- Adding a new relationship from the member side (no "link a user to this member" flow — would require a user picker and is a separate feature).
- Showing more user fields (phone, role, etc.).
- Server-side permission to let a regular user view the user-list for a member they're linked to (today they only see their own rows — unchanged).

## Testing plan

### API `GET /user-members`

- **Admin + `memberId=<m1>`**: returns only rows where `userMembers.memberId === m1`, ordered by id.
- **Admin + `userId=<u1>`**: still works as before (unchanged path).
- **Admin + both `userId` and `memberId`**: 400 with validation error naming both fields.
- **Admin + invalid `memberId` (not a UUID)**: 400.
- **Manager + `memberId=<m1>`**: allowed (same as admin).
- **Regular user + `memberId=<m1>`**: `memberId` ignored, response is still scoped to the caller's own userId (no privilege escalation).
- **Admin + `memberId=<m1>` returning zero rows**: 200 with empty `data` and correct pagination meta (`totalItems: 0`).
- **Response shape**: each row includes `userDisplayName`, `userEmail` (and the existing `memberFirstName`, `memberLastName`).
- **Pagination**: `page`/`itemsPerPage` still honored alongside `memberId`.
- **Auth**: 401 without token (unchanged).

### PWA — hook

- With `memberId`, the query is enabled and the query key contains `memberId`.
- With neither `userId` nor `memberId` and no logged-in user, the query is disabled.
- With both `userId` and `memberId` passed explicitly, the component logs a warning and does not query (avoids the API 400). (Covered by a unit test if we introduce one; otherwise a manual check.)

### PWA — manual

- Visit the admin member edit page for a member who has linked users: the Relationships section lists each linked user with their displayName + email; the type select shows "This is them / This is a relative"; the description line reads "They are {displayName}'s …".
- Edit a type or description as admin: row saves, list refreshes.
- Delete a link as admin: row disappears, confirmation prompt appears.
- Visit the account page (self-view): behavior unchanged — still lists the member side with the existing labels.

## Implementation steps

1. **API**: extend `list.ts` with the new Zod schema, the `memberId` branch, the `users` join, and the new selected columns. Update OpenAPI.
2. **API tests**: add the cases listed above to `user-members.test.ts`.
3. **Bruno**: add `~memberId:` to `list.bru`.
4. **PWA types**: extend `UserMember` with `userDisplayName`, `userEmail`.
5. **PWA hook**: extend `useUserMembers` to accept and forward `memberId`; update `enabled` and `queryKey`.
6. **PWA component**: preview the member-mode layout with the user first (per CLAUDE.md React Views rule), then add the `memberId` prop, the mode derivation, and the flipped labels.
7. **Validate**: `pnpm lint`, `pnpm -r typecheck`, `pnpm --filter=api test`. Manual check on the member form and account page.

## Decisions

- **Mutual exclusion** of `userId` and `memberId` is enforced at the API (400) rather than silently preferring one. Rationale: a caller passing both has a bug; we want it to be loud.
- **Admin/manager-only** for `memberId`: matches the existing pattern for `userId`.
- **User-side display**: `displayName` on the primary line, `email` dimmed below. Rationale: display name disambiguates most cases; email disambiguates when two users share a display name.

## Open considerations

- If we later want regular users to see "who else is linked to this member" (e.g. a parent seeing the other parent of their child), the privilege rule will need to loosen. Deferred until a concrete use case emerges.
- An `addRelationship` flow from the member page (picking a user) would be a natural next step but is out of scope here.
