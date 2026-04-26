---
name: 018 - 26/04/2026 - Pending Invitations
description: Show "Pending invitations" section on the admin member edit page (read+cancel) by extending GET /invitations to require userId or memberId and filter accordingly.
---

# 018 - 26/04/2026 - Pending Invitations

Add a "Pending invitations" section under the member edit form (`MemberFormPage`) listing non-expired, non-accepted invitations that target this member, with a per-row **Cancel** button (admin/manager). Back it by extending `GET /invitations` to require `userId` or `memberId` (mutually exclusive) and filter accordingly.

## Motivation

- Today the only way to see pending invitations is `GET /invitations` (received by current user, via email match) and `GET /invitations/sent` (sent by current user). Neither answers "who has been invited to link with member X but not accepted yet?".
- The admin member-form has a "Send invite" button (`InviteUserButton`) that fires off invitations into the void from the admin's perspective — there's no way to track who's still pending or to cancel a stale one without using Bruno.
- Roadmap explicitly calls out "Show member pending invitations" as a missing item.

## Scope

### API — extend `GET /invitations` to require `userId` or `memberId`

The current `GET /invitations` (in `apps/api/src/routes/invitations/listReceived.ts`) returns invitations received by the current user via email match. Generalize it to a parameterized list that always filters to *pending* invitations (not accepted, not expired) by either:

- **`userId=<uuid>`** — returns pending invitations *received by* the user with this id (looked up via the user's email column).
  - For a regular caller: must equal `req.user.id` (otherwise 403).
  - For admin/manager: any uuid is accepted; 404 if the user does not exist.
- **`memberId=<uuid>`** — returns pending invitations *targeting* this member.
  - Admin/manager only (regular user → 403).

`userId` and `memberId` are **mutually exclusive**, and **exactly one is required**.

This is a breaking change to the existing endpoint:

- Today: `GET /invitations` (no params) → my received pending invitations.
- After: `GET /invitations` → 400 (missing required param). The PWA hook flips to `GET /invitations?userId=<self>` to preserve the current behavior. Same response shape.

### API — files

- `apps/api/src/routes/invitations/listReceived.ts` — rewrite as a parameterized list (rename file/identifier to `list.ts` / `listRouter` to reflect the broader semantic; keep the `GET /` route mounted in `index.ts`).
- `apps/api/src/routes/invitations/index.ts` — update the import name only.
- Reuse `paginationQuerySchema`; extend with `userId` / `memberId` (both `z.uuid().optional()`) plus a `.refine` that requires exactly one of the two.
- Add a join on `users as inviters ON inviters.id = memberInvitations.invitedBy` and select `inviters.displayName as invitedByDisplayName` and `inviters.email as invitedByEmail` (used for the "Sent by" column).
- Swagger (`apps/api/src/swagger.ts`): update the path block parameters and extend `MemberInvitation` (or introduce a `MemberInvitationRow`) with the two new fields.
- Bruno (`documentation/bruno/invitations/`): update the existing `list-received.bru` (or rename) to include the required query param and document both modes.

### API — tests

`apps/api/src/routes/invitations/invitations.test.ts` — update the existing `GET /invitations` describe block:

- 401 unauthenticated.
- 400 when neither `userId` nor `memberId` is provided.
- 400 when both are provided.
- 400 when `userId` / `memberId` are not UUIDs.
- 200 happy path with `userId=<self>` (regular user) — returns the user's pending invitations (matched via email).
- 200 happy path with `userId=<other>` (admin) — looks up the other user's email and filters by it.
- 403 when a regular user passes `userId=<other>`.
- 404 when the `userId` does not exist (admin lookup).
- 200 happy path with `memberId=<x>` (admin) — returns pending invitations for that member.
- 403 when a regular user passes `memberId=<x>`.
- Confirm the `pending` filters (`acceptedAt IS NULL` and `expiresAt > now()`) are applied in both modes.

### PWA — hook

`apps/pwa/src/hooks/useInvitations.ts`: add a list query mirroring the `useTeamAssignments` shape:

```ts
export interface PendingInvitation {
    id: string;
    memberId: string;
    invitedBy: string;
    email: string;
    type: 'self' | 'relative';
    description: string | null;
    expiresAt: string;
    createdAt: string;
    memberFirstName: string;
    memberLastName: string;
}

interface UsePendingInvitationsArgs extends PaginationArgs {
    userId?: string;
    memberId?: string;
}

export function usePendingInvitations({ userId, memberId, page, itemsPerPage }: UsePendingInvitationsArgs) { … }
```

- `enabled: !!userId || !!memberId` — prevents firing without the required filter.
- Query key: `['invitations', { userId, memberId, page, itemsPerPage, token }]`.
- Reuses the existing `useDeleteInvitation` convention — but that hook **doesn't yet exist**. Add `useDeleteInvitation()` (DELETE `/api/invitations/:id`, invalidates `['invitations']`).

### PWA — `MemberPendingInvitations` component

`apps/pwa/src/components/admin/user/MemberPendingInvitations.tsx`. Mirrors the loading / error / empty / table shape of `UserMemberLinks`.

- Accepts `{ memberId: string }`.
- Loading: `<Loader size="sm" />`.
- Error: `<Alert color="red">Failed to load pending invitations</Alert>`.
- Empty: `<Alert color="blue">No pending invitations.</Alert>`.
- Populated: Mantine `<Table>`:
  - `Thead`: `#`, `Email`, `Type`, `Sent by`, `Sent on`, actions (~80px right-aligned).
  - **Email**: `Text size="sm" fw={700}`.
  - **Type**: `Text size="sm"` showing "Self" or "Relative" + `description` in dimmed `xs` underneath if present.
  - **Sent by**: `Text size="sm"` with `invitedByDisplayName`. `xs c="dimmed"` sub-line with `invitedByEmail`.
  - **Sent on**: `Text size="sm"` with `dayjs(createdAt).format('DD/MM/YYYY')`. Sub-line `xs c="dimmed"` showing "expires in N days" or "expires today" or "expired".
  - **Actions**: per-row Cancel (`IconTrash`, red, `ActionIcon`). `window.confirm("Cancel this invitation?")` then `useDeleteInvitation`.
- All success paths: `notifications.show({ color: 'green' })`. Errors: red toast.

### PWA — wire into `MemberFormPage`

`apps/pwa/src/pages/admin/MemberFormPage.tsx`: add a fourth `<FormWrapper>` after "Team assignments", gated on `member?.id` (matches existing pattern):

```tsx
{member?.id && (
    <FormWrapper>
        <Title order={3} mt="xl" mb="md">
            Pending invitations
        </Title>
        <MemberPendingInvitations memberId={member.id} />
    </FormWrapper>
)}
```

No section-header action button (the existing "Send invite" button in the "Family & members" header already covers creation).

### Out of scope

- **Resend invitation**: not adding "resend email" buttons. If the invitee lost the email, cancel + re-invite.
- **Editing an invitation**: invitations are immutable; only Cancel.
- **Showing invitations in the user-side `AccountPage`**: the existing `GET /invitations` (now `?userId=<self>`) already powers a future "my pending invitations" section on the account page, but wiring that view is a separate scope.
- **Bulk cancel**: no multi-select.
- **Filter by status (accepted/expired)**: this list shows *pending* only; an admin browse view of all invitations is out of scope.
- **`GET /invitations/sent`** stays untouched (different semantics: sent-by-me, no pending filter).

## Testing plan

### API

- See "API — tests" above.

### PWA — manual

- Open `/admin/members/:id` for a member that has pending invitations — section appears with rows.
- Member with no pending invitations — empty alert.
- Cancel a row: confirm dialog → DELETE → row disappears with green toast.
- Section is hidden on the create form (`/admin/members/new`).
- "Family & members" / "Team assignments" sections still work (regression).
- `/account` — no regression (the same hook is used to fetch the user's received invitations once that view is wired).

## Implementation steps

Each top-level section gets its own commit (per CLAUDE.md):

1. **API — extend `GET /invitations`** (rewrite `listReceived.ts` → `list.ts`, schema + auth + tests + swagger).
2. **API — Bruno** update for the new query params.
3. **PWA — hooks** (`usePendingInvitations`, `useDeleteInvitation`).
4. **PWA — `MemberPendingInvitations` component**.
5. **PWA — wire into `MemberFormPage`**.
6. **Validation**: `pnpm lint`, `pnpm -r run test`, manual smoke.

## Open considerations

1. **`userId` semantics**: I'm reading `userId` as **received-by** (email-match against the user's email column). That means an admin filtering by a userId looks up the user's email and matches invitations against it. If you instead meant "sent-by-this-user" (= invitedBy column), say so — the intent and SQL are different and the existing `GET /invitations/sent` already covers that case for the current user.
2. **Cancel UX**: `window.confirm` for parity with "Family & members" delete. If you'd prefer a Mantine modal confirm, flag it.
3. **"Sent by" column**: not shown in v1 to keep the table compact. Easy add if you want it.
4. **Date format**: `DD/MM/YYYY` matches the convention used elsewhere (e.g., the member search). Confirm.
