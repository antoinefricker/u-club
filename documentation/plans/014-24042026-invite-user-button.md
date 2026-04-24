# 014 - 24/04/2026 - Invite User Button

Add a PWA button on the admin member form that lets an admin/manager invite a user (by email) to link with the current member. Posts to the existing `POST /invitations` endpoint.

## Motivation

Per the invitation workflow (`documentation/plans/006-invitation-workflow.mermaid`), when viewing a member an admin should be able to kick off the email-invite flow. The API route and email pipeline already exist — what's missing is the UI.

The roadmap's admin section has "Send invite" as an open item; this closes it.

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
- **Invitations route**: no route changes. Existing test suite (`invitations.test.ts`) already covers the flow.

## Implementation steps

1. **API helper**: add `apps/api/src/utils/emailToken.ts` with `createEmailToken(ttlMs)`.
2. **API call sites**: migrate the 5 routes to use the helper (each keeps its existing TTL).
3. **API tests**: run `pnpm --filter=api test` to confirm no regression.
4. **PWA hook**: add `useCreateInvitation` in new `hooks/useInvitations.ts`.
5. **PWA component**: preview the modal layout with the user first (per CLAUDE.md React Views rule), then add `components/admin/user/InviteUserButton.tsx`.
6. **PWA page**: wire the button into `MemberFormPage.tsx`.
7. **Validate**: `pnpm --filter=pwa lint`, `pnpm -r typecheck`. Manual check on the admin member form.

## Decisions

- **Separate tables, shared generator**: `auth_tokens` and `member_invitations` stay as two tables (different payloads, different lifecycles). Only the 2-line *generation* pattern is unified. See the branch conversation for the full trade-off analysis of the alternative (FK from `member_invitations` to `auth_tokens`) — rejected because the join cost + enum creep + coupling outweighed the schema-level consistency savings for the two flows we have today.
- **Modal, not inline form** — matches `UserMemberLinks` edit UX and keeps the page tidy.
- **Type default `relative`** — the most common real-world case (admin inviting a parent/relative). Self-invites are usually rare.
- **Description collapse on `self`** — mirrors `UserMemberLinks` and the `memberInvitations` schema that doesn't meaningfully use description for self.
- **Invalidate `['user-members']` on success** — the link isn't created yet, but the invited user may accept quickly and we'd rather re-fetch than show stale.

## Open considerations

- **Preventing duplicate active invitations**: the API will silently insert a second `memberInvitations` row for the same email+member — no unique constraint is enforced today. If this becomes noise, we add a "pending invitation already exists" check (either DB-level unique index or route-level lookup). Out of scope for v1.
- **Showing pending invitations in `UserMemberLinks` (or a sibling list)**: natural follow-up once this ships, so admins can see what's pending before re-inviting.
