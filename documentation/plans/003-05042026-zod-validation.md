# Zod Request Validation

## Context

All API routes use inline `if` checks for request body validation (truthy + typeof). This is repetitive and error-prone. Zod provides type-safe schema validation with automatic error messages.

## Scope

Replace inline validation in create/update routes with Zod schemas. Keep database-level checks (uniqueness, FK existence) in route handlers since they require DB access.

## Plan

### 1. Install Zod

- `pnpm --filter @u-club/api add zod`

### 2. Create validate middleware

- **New:** `apps/api/src/middleware/validate.ts`
- Takes a Zod schema, parses `req.body`, returns 400 with field errors on failure
- Replaces `req.body` with parsed (typed) data on success

### 3. Create schemas per entity

- **New:** `apps/api/src/schemas/user.ts` — createUser, updateUser
- **New:** `apps/api/src/schemas/club.ts` — createClub, updateClub
- **New:** `apps/api/src/schemas/team.ts` — createTeam, updateTeam
- **New:** `apps/api/src/schemas/member.ts` — createMember, updateMember
- **New:** `apps/api/src/schemas/memberStatus.ts` — createMemberStatus, updateMemberStatus
- **New:** `apps/api/src/schemas/auth.ts` — login, emailLogin, confirmEmail, resendConfirmation

### 4. Refactor routes

For each create/update route:
- Remove inline `if (!field)` checks
- Add `validate(schema)` middleware
- Keep DB-level checks (uniqueness, FK) in handler

**Routes to refactor:**
- `users/create.ts`, `users/update.ts`
- `clubs/create.ts`, `clubs/update.ts`
- `teams/create.ts`, `teams/update.ts`
- `members/create.ts`, `members/update.ts`
- `member-statuses/create.ts`, `member-statuses/update.ts`
- `auth/login.ts`, `auth/emailLogin.ts`, `auth/confirmEmail.ts`, `auth/resendConfirmation.ts`

### 5. Update tests

- Existing tests should still pass (same error messages)
- Error format may change slightly — validate middleware returns structured errors

### 6. Update Swagger error schema

- Update 400 response schema to match Zod error format if needed

## Error format

```json
{
  "error": "validation error",
  "details": [
    { "field": "email", "message": "Required" },
    { "field": "gender", "message": "Invalid enum value" }
  ]
}
```

## Files to create/modify

- `apps/api/package.json` (add zod)
- `apps/api/src/middleware/validate.ts` (new)
- `apps/api/src/schemas/` (6 new files)
- 14 route files (refactor)
- Test files (update error assertions if format changes)

## Verification

1. `pnpm --filter @u-club/api test`
2. `pnpm lint`
3. Manual: send invalid requests → verify structured error responses
