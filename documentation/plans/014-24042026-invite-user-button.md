# 014 - 24/04/2026 - Invite User Button

Add a PWA button on the admin member form that lets an admin/manager invite a user (by email) to link with the current member. Posts to the existing `POST /invitations` endpoint.

## Motivation

Per the invitation workflow (`documentation/plans/006-invitation-workflow.mermaid`), when viewing a member an admin should be able to kick off the email-invite flow. The API route and email pipeline already exist — what's missing is the UI.

The roadmap's admin section has "Send invite" as an open item; this closes it.

See `014-invitation-workflow.mermaid` for the full updated end-to-end flow after this plan lands (public `GET /invitations/by-token/:token`, `POST .../register-and-accept`, unified `/invitation` page handling login/register/accept).

## Scope

### API — shared `createEmailToken` helper (preliminary)

Motivated by the observation that `auth_tokens` and `member_invitations` both store opaque email-bound tokens with TTLs but share no code: the `crypto.randomBytes(32).toString('hex')` + `new Date(Date.now() + ttl)` pattern is duplicated across 5 routes today. Unifying the *generation* (not the schema) avoids drift without coupling the two lifecycles.

- **File**: new `apps/api/src/utils/emailToken.ts` exporting:
  ```ts
  export function createEmailToken(ttlMs: number): { token: string; expiresAt: Date };
  ```
  - Uses `crypto.randomBytes(32).toString('hex')` and `new Date(Date.now() + ttlMs)`.
  - Caller chooses its own TTL (forgot-password, magic-link, invitation, etc. keep their existing expiry policy).
- **Call-site migration** (5 routes): replace the inline `const token = … / const expiresAt = …` pair with `const { token, expiresAt } = createEmailToken(TTL)`.
  - `apps/api/src/routes/auth/forgotPassword.ts:56`
  - `apps/api/src/routes/auth/magicLink.ts:56`
  - `apps/api/src/routes/auth/verifyEmailResend.ts:56`
  - `apps/api/src/routes/users/create.ts:68`
  - `apps/api/src/routes/invitations/create.ts:68`
- No DB changes. No test changes required (existing tests mock the DB, not the token generator).

### PWA — `useCreateInvitation` hook

- **File**: new `apps/pwa/src/hooks/useInvitations.ts`
- Uses TanStack `useMutation` posting to `/api/invitations`.
- Accepts `{ memberId, email, type, description? }` matching the API contract.
- Follows the auth-token-in-mutationFn pattern used by the other hooks (build headers inline inside `mutationFn`). `onSuccess` invalidates both `['user-members']` (the invite may soon become a link) and `['invitations']` (reserved for future invitation list views).
- Returns the mutation as-is — call sites handle `isPending` + `error` + notification.

### PWA — `InviteUserButton` component

- **File**: new `apps/pwa/src/components/admin/user/InviteUserButton.tsx`
- **Props**: `{ memberId: string; memberName?: string }`. `memberName` is optional and used only in the modal title (e.g. "Invite a user to link with Alice Dupont"); falls back to "this member" if absent.
- **Trigger**: Mantine `<Button leftSection={<IconUserPlus />}>Invite user</Button>`.
- **Modal**: Mantine `<Modal>` opened on click (controlled via `useDisclosure`).
- **Form** (Mantine `useForm`):
    - `email`: required, validated with the existing `emailValidation` helper in `apps/pwa/src/utils/formValidations/`.
    - `type`: `<Select>` with the same options used in `UserMemberLinks` when `useUserPointOfView={false}` — "This is them" (`self`) / "This is a relative" (`relative`). Default `relative`.
    - `description`: `<TextInput>`, optional. Visible only when `type === 'relative'` (mirrors `UserMemberLinks`'s collapse behavior). Placeholder: "father, mother, uncle…".
- **Submit**: calls `useCreateInvitation().mutate({ memberId, email, type, description: description || null })`.
    - `onSuccess`: show green notification "Invitation sent to {email}", reset form, close modal.
    - `onError`: show red notification with the API error message (Mantine `notifications.show`).
- **Loading state**: submit button shows `loading` while the mutation is pending; Cancel stays enabled.

### PWA — `MemberFormPage` placement

- **File**: `apps/pwa/src/pages/admin/MemberFormPage.tsx`
- Inside the existing `<FormWrapper>` that wraps the "Family & members" section, render the `<InviteUserButton memberId={member.id} memberName={`${member.firstName} ${member.lastName}`} />` under the section title, above `<UserMemberLinks>`.
- Button only appears when `member?.id` is truthy (i.e. the member is loaded — we're on an edit page, not a create page).

### API — public invitation lookup and register-and-accept

Adds two token-gated (no auth) routes so an invited user arriving at `/invitation?token=…` can see the invitation and, if they don't have an account yet, complete registration in a single form — skipping the separate email-verification round-trip since the click on the emailed link already proves email ownership.

**`GET /invitations/by-token/:token`** — public, no auth.
- Looks up the invitation by token. 404 if not found.
- Returns 400 if expired (`expiresAt < now()`) or already accepted (`acceptedAt != null`).
- Response body:
  ```json
  {
    "invitation": { "id", "email", "memberId", "memberFirstName", "memberLastName", "type", "description", "expiresAt" },
    "userExists": true | false
  }
  ```
- `userExists` = `db('users').where({ email: invitation.email }).first() !== undefined`. This is a minor information disclosure (anyone with the token can learn whether an account exists for the invited email) but consistent with how password-reset flows routinely behave. Accepted trade-off for simpler UX.
- The token itself is the authorization; no JWT required.

**`POST /invitations/by-token/:token/register-and-accept`** — public, no auth.
- Body: `{ displayName: string, password: string }`. Email comes from the invitation server-side; any `email` in the body is ignored.
- Validations:
  - Invitation exists / not expired / not accepted (same as GET).
  - No user already exists for `invitation.email` → 409 with message "an account already exists for this email; log in instead".
- Performs atomically in a transaction:
  1. Insert `users` row with `email = invitation.email`, hashed `password`, provided `displayName`, `role = 'user'`, `emailVerifiedAt = now()` (pre-verified — token click proves ownership).
  2. Insert `userMembers` row linking the new user to `invitation.memberId`, carrying `invitation.type` and `invitation.description`.
  3. Mark `memberInvitations.acceptedAt = now()`.
- Returns the same shape as `POST /auth/login`: `{ token, user }`. UI immediately calls `login()` with the token to hydrate `AuthContext`.
- OpenAPI annotation and Bruno file included.

**Schema**: new Zod schema `registerAndAcceptInvitationSchema` in `apps/api/src/schemas/invitation.ts`:
```ts
{ displayName: z.string().min(1), password: z.string().min(8) }
```
(Minimum password length matches existing `POST /users` policy.)

### PWA — invitation page redesign

- **Route placement**: revert the earlier route-move so `/invitation` sits **outside** `<App />`. `InvitationPage` becomes self-contained and handles all three auth/registration states itself. Rationale: the unauthenticated branch is invitation-specific (not the generic `Unauthenticated` login flow), so putting it outside `App` avoids adding invitation-awareness to `PageLayout`.
- **Hook**: new `useInvitationByToken(token)` in `hooks/useInvitations.ts` — `useQuery` calling the new GET endpoint. Disabled when `!token`. Includes `token` in the key.
- **Hook**: new `useRegisterAndAcceptInvitation()` mutation calling the new POST endpoint. On success, calls `useAuthContext().loginWithToken(authToken, user)` (or equivalent) to hydrate the session, then navigates to `/`.
- **`AuthContext` change**: expose a lightweight `hydrate(token, user)` method alongside `login(email, password)` so the register-and-accept flow can set the session without re-calling `POST /auth/login`. Low-blast-radius: the existing `login` implementation already sets both; factor out a helper and expose it.
- **Page layout inside `InvitationPage`**: when authenticated, wrap the content in the same `AppShell` that `PageLayout` uses (or better: keep the page self-contained with its own minimal centered layout, showing the user's name + a Logout link in the corner if they're logged in). Final choice decided when previewing with the user.
- **Three rendered states**:
  - **Authenticated**: show the invitation accept form (existing UX). Keep nav if we choose AppShell; otherwise a minimal header.
  - **Unauthenticated + `userExists`**: show login form. Fields: email (prefilled from `invitation.email`, disabled), password. On submit → standard `login()`. Page re-renders authenticated; the accept form appears.
  - **Unauthenticated + `!userExists`**: show register form. Fields: email (prefilled, disabled), `displayName`, `password`. On submit → `useRegisterAndAcceptInvitation()` → on success hydrate session + show success screen → redirect to `/` after a short delay.
- **Dead code**: drop the current `if (!isAuthenticated)` branch that renders a "Log in or Register" button navigating to `/` (it's superseded by the new flow).

### Out of scope

- Listing pending invitations for a member (API has `GET /invitations/sent` but no PWA view yet — separate task).
- Canceling / resending invitations from the UI.
- Inviting from the self-account page (`AccountPage`). The current UX is admin-only; the API does support regular users linked to the member, but the UI gate is out of scope.
- Changing the API contract.

## Testing plan

### PWA — manual

- On the admin member edit page, click "Invite user" → modal opens.
- Submit with a valid email and `type=relative` + description "father" → notification "Invitation sent to …" appears; modal closes. An email lands in the dev mailer. `memberInvitations` row created.
- Submit with `type=self` → description field hidden; submit works.
- Submit with an invalid email (`foo`) → inline form validation error, no network request.
- Submit while API is slow → button shows loading state, modal disables submit.
- API returns 403 (regular user not linked) → red notification with the API error; modal stays open.
- Open the modal, type something, cancel → reopening the modal starts with cleared form.

### API

- **`createEmailToken` helper**: call sites exercised indirectly by the existing auth and invitation tests (which mock the DB, not the token generator). Manually verify that `forgotPassword`, `magicLink`, `verifyEmailResend`, `users/create`, and `invitations/create` still produce a 64-char hex token and the correct `expiresAt` after the refactor.
- **Existing invitations routes**: no changes to `POST /invitations`, `GET /invitations`, `POST /invitations/:id/accept`, `DELETE /invitations/:id`. Existing test suite already covers them.
- **New `GET /invitations/by-token/:token`**:
  - 200 with invitation body + `userExists: true` when an account exists for the email.
  - 200 with invitation body + `userExists: false` when no account.
  - 400 when expired.
  - 400 when already accepted.
  - 404 when token not found.
- **New `POST /invitations/by-token/:token/register-and-accept`**:
  - 201 happy path → returns `{ token, user }` with the user pre-verified; the `memberInvitations.acceptedAt` is set; a `userMembers` row is inserted linking the new user to the invitation's member.
  - 409 when a user already exists for the invitation's email.
  - 400 when the invitation is expired or already accepted.
  - 404 when token not found.
  - 400 when `displayName` missing or `password` < 8 chars.
  - Transaction atomicity: if any step fails mid-way, no partial rows are written.

## Implementation steps

1. **API helper**: add `apps/api/src/utils/emailToken.ts` with `createEmailToken(ttlMs)`.
2. **API call sites**: migrate the 5 routes to use the helper (each keeps its existing TTL).
3. **API tests**: run `pnpm --filter=api test` to confirm no regression.
4. **PWA hook**: add `useCreateInvitation` in new `hooks/useInvitations.ts`.
5. **PWA component**: preview the modal layout with the user first (per CLAUDE.md React Views rule), then add `components/admin/user/InviteUserButton.tsx`.
6. **PWA page**: wire the button into `MemberFormPage.tsx`.
7. **API `GET /invitations/by-token/:token`**: new route + Zod schema + OpenAPI + Bruno. Tests.
8. **API `POST /invitations/by-token/:token/register-and-accept`**: new route + Zod schema + transaction + OpenAPI + Bruno. Tests.
9. **PWA auth**: expose `hydrate(token, user)` on `AuthContext` so the register flow can set the session without re-calling login.
10. **PWA hooks**: add `useInvitationByToken` and `useRegisterAndAcceptInvitation` in `hooks/useInvitations.ts`.
11. **PWA page**: rewrite `InvitationPage` to handle the three states. Preview the layout with the user first.
12. **Route placement**: revert the earlier route-move in `main.tsx` so `/invitation` sits outside `<App />`.
13. **Validate**: `pnpm --filter=pwa lint`, `pnpm -r typecheck`, `pnpm --filter=api test`. Manual check on the three flows (authenticated accept, login-then-accept, register-and-accept).

## Decisions

- **Separate tables, shared generator**: `auth_tokens` and `member_invitations` stay as two tables (different payloads, different lifecycles). Only the 2-line *generation* pattern is unified. See the branch conversation for the full trade-off analysis of the alternative (FK from `member_invitations` to `auth_tokens`) — rejected because the join cost + enum creep + coupling outweighed the schema-level consistency savings for the two flows we have today.
- **Modal, not inline form** — matches `UserMemberLinks` edit UX and keeps the page tidy.
- **Type default `relative`** — the most common real-world case (admin inviting a parent/relative). Self-invites are usually rare.
- **Description collapse on `self`** — mirrors `UserMemberLinks` and the `memberInvitations` schema that doesn't meaningfully use description for self.
- **Skip email verification for invitation-driven registration**: clicking the emailed invitation link proves email ownership, so the register-and-accept flow marks the new user's email as verified in the same transaction. No separate verification round-trip.
- **`userExists` exposed on `GET /invitations/by-token/:token`**: accepts the minor information disclosure ("is there an account for this email?") to drive a simpler UX (no Login/Register tabs). Same trade-off made by typical password-reset flows.
- **Invitation-driven registration uses a dedicated public endpoint** (`POST /invitations/by-token/:token/register-and-accept`) rather than reusing `POST /users` with a flag. Rationale: the new endpoint is atomic (user + userMembers + accepted_at in one transaction), skips the email-verification emails, and never allows creating a user *without* an invitation context via that path.
- **Password minimum 8 chars**: consistent with existing `POST /users`.
- **Invalidate `['user-members']` on success** — the link isn't created yet, but the invited user may accept quickly and we'd rather re-fetch than show stale.

## Open considerations

- **Preventing duplicate active invitations**: the API will silently insert a second `memberInvitations` row for the same email+member — no unique constraint is enforced today. If this becomes noise, we add a "pending invitation already exists" check (either DB-level unique index or route-level lookup). Out of scope for v1.
- **Showing pending invitations in `UserMemberLinks` (or a sibling list)**: natural follow-up once this ships, so admins can see what's pending before re-inviting.
