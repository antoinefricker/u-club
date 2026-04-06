# Users-Members Relationship

## Context

Currently a member has a single optional `user_id` FK (1:1). We need a many-to-many relationship:

- A user can be linked to multiple members (e.g. parent linked to their children)
- A user can be a member themselves
- Users can describe their relationship to each member (free text, e.g. "father", "myself", "uncle")
- Some users have no member link at all but still access the app

## Data model

### `user_members` join table

| Column      | Type      | Constraints                                   |
| ----------- | --------- | --------------------------------------------- |
| id          | uuid      | PK, auto                                      |
| user_id     | uuid      | FK → users, required                          |
| member_id   | uuid      | FK → members, required                        |
| type        | enum      | required (self, relative)                     |
| description | string    | nullable (e.g. "father", "guardian", "uncle") |
| created_at  | timestamp | auto                                          |

Unique constraint on (user_id, member_id) — one relationship per user-member pair.

### `member_invitations` table

| Column      | Type       | Constraints                                      |
| ----------- | ---------- | ------------------------------------------------ |
| id          | uuid       | PK, auto                                         |
| member_id   | uuid       | FK → members, required                           |
| invited_by  | uuid       | FK → users, required                             |
| email       | string     | required                                         |
| type        | enum       | required (self, relative)                        |
| description | string     | nullable (suggested relationship, e.g. "mother") |
| token       | string(64) | unique                                           |
| expires_at  | timestamp  | required (7 days)                                |
| accepted_at | timestamp  | nullable                                         |
| created_at  | timestamp  | auto                                             |

Flow:

1. User invites someone via email to link to a member they're connected to
2. Email contains a link: `${APP_URL}/invitation?token=${token}&email=${email}`
3. If recipient has an account → log in, accept invitation → `user_members` entry created
4. If no account → register first → accept invitation → `user_members` entry created
5. Invitation description is pre-filled but editable by recipient

### Migration: remove `user_id` from `members`

- Drop the `user_id` column from `members` table
- Data migration: move existing `user_id` links into `user_members` with description "self"

## Permissions

| Action                               | admin                  | manager | user                  |
| ------------------------------------ | ---------------------- | ------- | --------------------- |
| List own relationships               | ✅                     | ✅      | ✅                    |
| Create/edit/delete own relationships | ✅                     | ✅      | ✅                    |
| List any user's relationships        | ✅                     | ✅      | ✅                    |
| Create/edit/delete for other users   | ✅                     | ✅      | ❌                    |
| Invite to a linked member            | ✅                     | ✅      | ✅ (own members only) |
| Invite to any member                 | ✅                     | ✅      | ❌                    |
| Accept invitation                    | any authenticated user |         |                       |

## Workflows

- [Registration & login flow](006-registration-login-workflow.mermaid)
- [Invitation flow](006-invitation-workflow.mermaid)

## Plan

### 1. Migration: create `user_members` table

- **New:** `apps/api/src/migrations/20260406_create_user_members.ts`

### 2. Migration: move data and drop `user_id` from `members`

- **New:** `apps/api/src/migrations/20260406_remove_user_id_from_members.ts`
- Migrate existing user_id links to `user_members` with description "self"
- Drop `user_id` column from `members`

### 3. Migration: create `member_invitations` table

- **New:** `apps/api/src/migrations/20260406_create_member_invitations.ts`

### 4. API: User-member relationship routes

- **New:** `apps/api/src/routes/user-members/`
  - `GET /user-members` — list relationships for current user (auth required)
  - `GET /user-members?userId=` — list for specific user (admin/manager)
  - `POST /user-members` — create relationship (user creates own, admin creates any)
  - `PUT /user-members/:id` — update description (owner or admin)
  - `DELETE /user-members/:id` — remove relationship (owner or admin)

### 5. API: Invitation routes

- **New:** `apps/api/src/routes/invitations/`
  - `POST /invitations` — send invitation (auth required, must be linked to the member)
  - `GET /invitations` — list pending invitations for current user (received)
  - `GET /invitations/sent` — list invitations sent by current user
  - `POST /invitations/:id/accept` — accept invitation (creates user_members entry)
  - `DELETE /invitations/:id` — cancel invitation (sender or admin)

### 6. Zod schemas

- **New:** `apps/api/src/schemas/userMember.ts`
- **New:** `apps/api/src/schemas/invitation.ts`

### 7. Update member routes

- **Modify:** members list/get — remove `user_id` from select columns
- **Modify:** members create/update — remove `user_id` from allowed fields

### 8. Update seed script

- **Modify:** `apps/api/src/seed-create.ts` — create `user_members` entries instead of setting `user_id`

### 9. PWA: Invitation page

- **New:** `apps/pwa/src/pages/InvitationPage.tsx`
  - Reads token + email from URL params
  - If logged in → show invitation details, accept button
  - If not logged in → prompt to log in or register, then accept
- **Modify:** `apps/pwa/src/main.tsx` — add `/invitation` route

### 10. Swagger, types, diagram

- **Modify:** `apps/api/src/swagger.ts` — add UserMember schema, remove user_id from Member
- **Modify:** `documentation/database-diagram.mermaid` — add USER_MEMBER entity
- **Modify:** `apps/api/src/types/user.ts` if needed

### 11. Tests

- User-member CRUD tests
- Invitation tests: send, accept, cancel, expired token, already accepted
- Update member tests (remove user_id references)

### 12. Bruno files

- **New:** `documentation/bruno/user-members/` — list, create, update, delete
- **New:** `documentation/bruno/invitations/` — send, list received, list sent, accept, cancel

## Files to create/modify

- `apps/api/src/migrations/` (3 new)
- `apps/api/src/routes/user-members/` (new)
- `apps/api/src/routes/invitations/` (new)
- `apps/api/src/schemas/userMember.ts` (new)
- `apps/api/src/schemas/invitation.ts` (new)
- `apps/api/src/routes/members/` (update)
- `apps/api/src/seed-create.ts`
- `apps/api/src/swagger.ts`
- `apps/pwa/src/pages/InvitationPage.tsx` (new)
- `apps/pwa/src/main.tsx`
- `documentation/database-diagram.mermaid`
- `documentation/bruno/user-members/` (new)
- `documentation/bruno/invitations/` (new)

## Verification

1. `pnpm --filter @eggplant/api test`
2. `pnpm lint`
3. `make seed-create FORCE=1` — verify user_members populated
4. Manual: user links themselves to a member, edits description
5. Manual: user invites someone → email sent → recipient registers → accepts → relationship created
6. Manual: try accepting expired invitation → error
