# 009 – 21/04/2026 – API Test Coverage

## Problem

The API has a solid baseline of route tests (17 files, 137 tests, all passing), but several gaps prevent us from trusting coverage as a signal:

1. **No coverage instrumentation.** `@vitest/coverage-v8` is not installed, so we have no quantitative view of line/branch coverage. All evaluation today is by inspection.
2. **Middleware has no direct tests.** `auth`, `requireRole`, `requireSelfOrRole`, `validate`, `errorHandler` are exercised only through route tests. Authorization regressions (e.g. a role check silently becoming a no-op) can slip through.
3. **Zod schemas are not unit-tested.** They're only hit via 400-path route tests, so the wire contract isn't locked in independently of handlers.
4. **Pure utility modules are untested.** `password.ts` (hashing/verification), `mailer.ts`, and parts of `db.ts` deserve direct tests.
5. **Some auth endpoints are thinly tested.** `forgotPassword` (3), `magicLink` (3), `magicLinkVerify` (4), `verifyEmailResend` (4) are well below the depth of `login` (7) / `resetPassword` (6). Likely missing cases: rate limiting, malformed emails, already-verified replay, expired vs. invalid tokens.

## Current state (snapshot)

### Route-level tests — all present

| Area                     | Files | Tests | Notes                                    |
| ------------------------ | ----- | ----- | ---------------------------------------- |
| `routes/auth` (8 routes) | 8     | 37    | Every endpoint has a test file           |
| `routes/clubs`           | 1     | 13    | Full CRUD                                |
| `routes/members`         | 1     | 13    | Full CRUD                                |
| `routes/teams`           | 1     | 13    | Full CRUD                                |
| `routes/teams/assignments` | 1   | 8     | Team assignment operations               |
| `routes/users`           | 1     | 15    | Full CRUD                                |
| `routes/user-members`    | 1     | 15    | Full CRUD                                |
| `routes/invitations`     | 1     | 12    | create / list / accept / delete          |
| `routes/member-statuses` | 1     | 10    | Full CRUD                                |
| `routes/health`          | 1     | 1     | Smoke test                               |
| **Total**                | **17**| **137** | All passing                            |

### Gaps — no direct tests

| Surface                                    | Status                    |
| ------------------------------------------ | ------------------------- |
| `middleware/auth.ts`                       | ⚠️ indirect only          |
| `middleware/requireRole.ts`                | ⚠️ indirect only          |
| `middleware/requireSelfOrRole.ts`          | ⚠️ indirect only          |
| `middleware/validate.ts`                   | ⚠️ indirect only          |
| `middleware/errorHandler.ts`               | ⚠️ indirect only          |
| `schemas/*` (9 files)                      | ⚠️ indirect via route 400s |
| `password.ts`                              | ❌ no tests               |
| `mailer.ts`                                | ❌ no tests               |
| `db.ts`                                    | ❌ no tests               |
| `swagger.ts`, `app.ts`                     | ❌ no tests (mostly glue) |

### Quality signal — typical route test matrix

Most CRUD routes cover the expected cases: happy path (2xx), 404 not-found, 400 validation, 409 conflict, 403 permission. Shape is good; depth varies.

## Baseline coverage (captured 21/04/2026)

After installing `@vitest/coverage-v8` and running `pnpm --filter @eggplant/api test:coverage`:

### Top-level summary

```
All files          |   95.41 |    87.17 |   71.42 |   95.41
```

### Root (`src/`)

| File            | Stmts | Branch | Funcs | Lines | Notes                    |
| --------------- | ----- | ------ | ----- | ----- | ------------------------ |
| `app.ts`        | 100   | 100    | 100   | 100   |                          |
| `db.ts`         | 0     | 0      | 0     | 0     | Pool glue, low value     |
| `mailer.ts`     | 100   | 0      | 100   | 100   | 0% branches              |
| `password.ts`   | 20.83 | 100    | 0     | 20.83 | **Real gap**             |

### Middleware (`src/middleware/`)

| File                     | Stmts | Branch | Funcs | Lines | Uncovered  |
| ------------------------ | ----- | ------ | ----- | ----- | ---------- |
| `auth.ts`                | 82.75 | 71.42  | 100   | 82.75 | 26–28, 43–44 |
| `errorHandler.ts`        | 11.11 | 100    | 0     | 11.11 | **Real gap** — 4–13 |
| `requireRole.ts`         | 70    | 66.66  | 100   | 70    | 8–10       |
| `requireSelfOrRole.ts`   | 70    | 75     | 100   | 70    | 8–10       |
| `validate.ts`            | 100   | 85.71  | 100   | 100   | line 6     |

### Routes (`src/routes/`)

| Route file                             | Stmts | Branch | Funcs | Lines | Uncovered |
| -------------------------------------- | ----- | ------ | ----- | ----- | --------- |
| `health.ts`                            | 100   | 100    | 100   | 100   |           |
| **auth/**                              |       |        |       |       |           |
| `auth/forgotPassword.ts`               | 100   | 75     | 100   | 100   | 71        |
| `auth/index.ts`                        | 100   | 100    | 100   | 100   |           |
| `auth/login.ts`                        | 100   | 100    | 100   | 100   |           |
| `auth/logout.ts`                       | 100   | 88.88  | 100   | 100   | 60        |
| `auth/magicLink.ts`                    | 100   | 75     | 100   | 100   | 69        |
| `auth/magicLinkVerify.ts`              | 93.18 | 88.88  | 100   | 93.18 | 81–83     |
| `auth/resetPassword.ts`                | 93.47 | 83.33  | 100   | 93.47 | 87–89     |
| `auth/verifyEmail.ts`                  | 93.18 | 83.33  | 100   | 93.18 | 82–84     |
| `auth/verifyEmailResend.ts`            | 100   | 83.33  | 100   | 100   | 71        |
| **clubs/**                             |       |        |       |       |           |
| `clubs/create.ts`                      | 100   | 100    | 100   | 100   |           |
| `clubs/delete.ts`                      | 100   | 100    | 100   | 100   |           |
| `clubs/get.ts`                         | 100   | 100    | 100   | 100   |           |
| `clubs/index.ts`                       | 100   | 100    | 100   | 100   |           |
| `clubs/list.ts`                        | 100   | 100    | 100   | 100   |           |
| `clubs/update.ts`                      | 100   | 100    | 100   | 100   |           |
| **invitations/**                       |       |        |       |       |           |
| `invitations/accept.ts`                | 100   | 100    | 100   | 100   |           |
| `invitations/create.ts`                | 100   | 83.33  | 100   | 100   | 92        |
| `invitations/delete.ts`                | 85    | 60     | 100   | 85    | 45–47     |
| `invitations/index.ts`                 | 100   | 100    | 100   | 100   |           |
| `invitations/listReceived.ts`          | 90.32 | 50     | 100   | 90.32 | 61–63     |
| `invitations/listSent.ts`              | 100   | 100    | 100   | 100   |           |
| **member-statuses/**                   |       |        |       |       |           |
| `member-statuses/create.ts`            | 100   | 100    | 100   | 100   |           |
| `member-statuses/delete.ts`            | 100   | 100    | 100   | 100   |           |
| `member-statuses/index.ts`             | 100   | 100    | 100   | 100   |           |
| `member-statuses/list.ts`              | 100   | 100    | 100   | 100   |           |
| `member-statuses/update.ts`            | 100   | 100    | 100   | 100   |           |
| **members/**                           |       |        |       |       |           |
| `members/create.ts`                    | 100   | 100    | 100   | 100   |           |
| `members/delete.ts`                    | 100   | 100    | 100   | 100   |           |
| `members/get.ts`                       | 100   | 100    | 100   | 100   |           |
| `members/index.ts`                     | 100   | 100    | 100   | 100   |           |
| `members/list.ts`                      | 87.09 | 50     | 100   | 87.09 | 51–54     |
| `members/update.ts`                    | 100   | 100    | 100   | 100   |           |
| **teams/**                             |       |        |       |       |           |
| `teams/assignments.ts`                 | 100   | 100    | 100   | 100   |           |
| `teams/create.ts`                      | 100   | 100    | 100   | 100   |           |
| `teams/delete.ts`                      | 100   | 100    | 100   | 100   |           |
| `teams/get.ts`                         | 100   | 100    | 100   | 100   |           |
| `teams/index.ts`                       | 100   | 100    | 100   | 100   |           |
| `teams/list.ts`                        | 92.59 | 50     | 100   | 92.59 | 47–48     |
| `teams/update.ts`                      | 100   | 100    | 100   | 100   |           |
| **user-members/**                      |       |        |       |       |           |
| `user-members/create.ts`               | 100   | 100    | 100   | 100   |           |
| `user-members/delete.ts`               | 100   | 100    | 100   | 100   |           |
| `user-members/index.ts`                | 100   | 100    | 100   | 100   |           |
| `user-members/list.ts`                 | 93.54 | 75     | 100   | 93.54 | 54–55     |
| `user-members/update.ts`               | 100   | 100    | 100   | 100   |           |
| **users/**                             |       |        |       |       |           |
| `users/create.ts`                      | 100   | 80     | 100   | 100   | 58, 92    |
| `users/delete.ts`                      | 100   | 100    | 100   | 100   |           |
| `users/get.ts`                         | 100   | 100    | 100   | 100   |           |
| `users/index.ts`                       | 100   | 100    | 100   | 100   |           |
| `users/list.ts`                        | 100   | 100    | 100   | 100   |           |
| `users/update.ts`                      | 96.07 | 71.42  | 100   | 96.07 | 78–79     |

### Schemas (`src/schemas/`)

Every file — `auth.ts`, `club.ts`, `invitation.ts`, `member.ts`, `memberStatus.ts`, `team.ts`, `teamAssignment.ts`, `user.ts`, `userMember.ts` — is at **100% across all metrics**, covered indirectly through route tests.

### Key findings that change the plan from its first draft

- Schemas are **already at 100%** through route tests — no need for separate schema unit tests. **Step 3 is dropped.**
- The real gaps are concentrated in **`password.ts`** (20%), **`errorHandler.ts`** (11%), and the two `requireRole*` middleware (~70%).
- Routes are in excellent shape (95–100%). The few remaining uncovered route lines (e.g. `invitations/delete.ts:45-47`, `members/list.ts:51-54`, `invitations/listReceived.ts:61-63`) are typically filter/error branches — worth a pass but low-impact.
- `mailer.ts` has 100% lines but 0% branches — worth a direct test.

## Target state

1. Coverage is **measurable**: `pnpm test --coverage` produces a line/branch report and a threshold gate.
2. **Middleware** has dedicated unit tests, especially for authZ paths.
3. **Zod schemas** have their own tests covering valid inputs, invalid inputs, and edge cases (empty strings, extra fields, type coercion).
4. **`password.ts`** is fully unit-tested (pure functions, easy wins).
5. **Thin auth endpoints** reach parity with `login` / `resetPassword` in test depth.

## Approach

### Step 1 — Install coverage tooling

- Add `@vitest/coverage-v8` as a dev dependency in `apps/api`.
- Configure `vitest.config.ts` (or inline `test` block in `package.json`) with:
  - `coverage.provider: 'v8'`
  - `coverage.reporter: ['text', 'html', 'lcov']`
  - `coverage.include: ['src/**/*.ts']`
  - `coverage.exclude: ['src/**/*.test.ts', 'src/test-utils.ts', 'src/migrations/**', 'src/scripts/**', 'src/types/**']`
- Add `test:coverage` npm script.
- Establish baseline numbers; commit them in this plan as a reference.

### Step 2 — Middleware unit tests

Create one test file per middleware under `src/middleware/__tests__/` (or colocated `*.test.ts`):

- `auth.test.ts` — no token → 401, invalid token → 401, expired token → 401, valid token → sets `req.user` and calls `next`.
- `requireRole.test.ts` — user lacks role → 403, user has role → `next`.
- `requireSelfOrRole.test.ts` — neither self nor role → 403, self → `next`, role → `next`.
- `validate.test.ts` — invalid body → 400 with Zod error details, valid body → `next`, replaces `req.body` with parsed data.
- `errorHandler.test.ts` — Zod error → 400, known `HttpError` → mapped status, unknown error → 500 (no leak of stack).

### Step 3 — Schema unit tests

One test file per schema under `src/schemas/__tests__/` covering:

- Minimal valid payload passes.
- Required fields missing → fail.
- Wrong type → fail.
- Extra unknown fields → behavior (pass/strip/fail) matches intent.
- String trim / case / email validation behaviour.

### Step 4 — Utility tests

- `password.test.ts` — `hash()` produces verifiable output; `verify()` matches correct / rejects wrong; different salts produce different hashes.
- `mailer.test.ts` — with a mocked transport, the right payload (`to`, `subject`, template vars) is sent for each email type.

### Step 5 — Fill thin auth tests

Bring the following up to the depth of `login`/`resetPassword`:

- **`forgotPassword`**: non-existing email returns same 200 as existing (no user enumeration), rate limiting (if implemented), malformed email → 400.
- **`magicLink`**: non-existing email behaviour, rate limiting, malformed email.
- **`magicLinkVerify`**: expired token vs invalid token distinction, already-used token, token for deleted user.
- **`verifyEmailResend`**: already-verified user behaviour, rate limiting, unknown email.

### Step 6 — Coverage gate (optional)

Once baseline is established and gaps above are filled, add a minimum threshold (e.g. 80% lines, 70% branches) to `vitest` config so regressions fail CI.

## Out of scope

- Changing existing route tests that already pass.
- Adding tests for migrations or seed scripts.
- E2E tests that span PWA + API (separate concern).

## Acceptance

- [ ] `pnpm --filter @eggplant/api test:coverage` produces a coverage report.
- [ ] Every middleware file has a dedicated test file.
- [ ] Every schema file has a dedicated test file.
- [ ] `password.ts` and `mailer.ts` have dedicated tests.
- [ ] `forgotPassword`, `magicLink`, `magicLinkVerify`, `verifyEmailResend` each have ≥ 6 tests.
- [ ] Coverage thresholds configured (or documented baseline committed).
