# Lost Password

## Context

Users who forget their password need a way to reset it. We'll reuse the existing `auth_tokens` table (with `type: 'password_reset'`) and the mailer infrastructure.

## Flow

1. User clicks "Forgot password?" on login form
2. Enters their email → `POST /auth/forgot_password`
3. Receives email with reset link (1 hour expiry)
4. Clicks link → lands on `/reset-password?token=xxx&email=xxx`
5. Enters new password → `POST /auth/reset_password`
6. Password updated, auto-logged in (JWT returned)

## Plan

### 0. Rename login_tokens to auth_tokens
- **Done:** migration `20260405_07_rename_login_tokens_to_auth_tokens.ts` + all references updated

### 1. Rename emailLogin/emailToken to magicLink/magicLinkVerify
- **Done:** renamed route files, tests, Bruno files, Zod schema, and index imports
  - `POST /auth/email_login` → `POST /auth/magic_link`
  - `POST /auth/email_token` → `POST /auth/magic_link_verify`
  - `emailLoginSchema` → `magicLinkSchema`

### 2. API: Forgot password endpoint
- **Done:** `apps/api/src/routes/auth/forgotPassword.ts`
- `POST /auth/forgot_password` — accepts `{ email }`
- Always returns 200 (prevent email enumeration)
- If user exists: generate token, store in `auth_tokens` with `type: 'password_reset'`, 1h expiry
- Send email with link: `${APP_URL}/reset-password?token=${token}&email=${email}`

### 3. API: Reset password endpoint
- **Done:** `apps/api/src/routes/auth/resetPassword.ts`
- `POST /auth/reset_password` — accepts `{ token, email, password }`
- Validate token in `auth_tokens` where `type = 'password_reset'` and not expired
- Delete token (single use)
- Hash new password, update user
- Return JWT (auto-login)

### 4. Zod schemas
- **Done:** `apps/api/src/schemas/auth.ts`
  - `forgotPasswordSchema` — `{ email }`
  - `resetPasswordSchema` — `{ token, email, password }`

### 5. Mount routes
- **Done:** `apps/api/src/routes/auth/index.ts`

### 6. PWA: Forgot password form
- **Done:** `apps/pwa/src/layout/ForgotPasswordForm.tsx`
  - Email input, submit button, "Check your email" message on success
- **Done:** `apps/pwa/src/layout/LoginForm.tsx` — added "Forgot password?" link + `onForgotPassword` prop
- **Done:** `apps/pwa/src/layout/Unauthenticated.tsx` — added 'forgot' view state

### 7. PWA: Reset password page
- **Done:** `apps/pwa/src/pages/ResetPasswordPage.tsx`
  - Reads token + email from URL params
  - New password + confirm password inputs
  - On success: stores JWT, redirects to `/`
- **Done:** `apps/pwa/src/main.tsx` — added `/reset-password` route

### 8. OpenAPI + Bruno
- **Done:** OpenAPI annotations on both endpoints
- **Done:** `documentation/bruno/auth/forgot-password.bru`
- **Done:** `documentation/bruno/auth/reset-password.bru`
- **Done:** renamed `email-login.bru` → `magic-link.bru`, `email-token.bru` → `magic-link-verify.bru`

### 9. Tests
- **Done:** `forgotPassword.test.ts` — 3 tests (400 missing email, 200 silent for unknown, 200 with email sent)
- **Done:** `resetPassword.test.ts` — 6 tests (400 missing fields, 401 invalid token, 401 user not found, 200 success)

## Files created/modified
- `apps/api/src/migrations/20260405_07_rename_login_tokens_to_auth_tokens.ts` (new)
- `apps/api/src/routes/auth/forgotPassword.ts` (new)
- `apps/api/src/routes/auth/forgotPassword.test.ts` (new)
- `apps/api/src/routes/auth/resetPassword.ts` (new)
- `apps/api/src/routes/auth/resetPassword.test.ts` (new)
- `apps/api/src/routes/auth/magicLink.ts` (renamed from emailLogin.ts)
- `apps/api/src/routes/auth/magicLink.test.ts` (renamed)
- `apps/api/src/routes/auth/magicLinkVerify.ts` (renamed from emailToken.ts)
- `apps/api/src/routes/auth/magicLinkVerify.test.ts` (renamed)
- `apps/api/src/routes/auth/index.ts`
- `apps/api/src/routes/auth/emailLogin.ts` (renamed → all auth_tokens refs)
- `apps/api/src/routes/auth/confirmEmail.ts` (auth_tokens refs)
- `apps/api/src/routes/auth/resendConfirmation.ts` (auth_tokens refs)
- `apps/api/src/routes/users/create.ts` (auth_tokens refs)
- `apps/api/src/seed-clear.ts` (auth_tokens refs)
- `apps/api/src/schemas/auth.ts`
- `apps/pwa/src/layout/ForgotPasswordForm.tsx` (new)
- `apps/pwa/src/layout/LoginForm.tsx`
- `apps/pwa/src/layout/Unauthenticated.tsx`
- `apps/pwa/src/pages/ResetPasswordPage.tsx` (new)
- `apps/pwa/src/main.tsx`
- `documentation/database-diagram.mermaid`
- `documentation/bruno/auth/forgot-password.bru` (new)
- `documentation/bruno/auth/reset-password.bru` (new)
- `documentation/bruno/auth/magic-link.bru` (renamed)
- `documentation/bruno/auth/magic-link-verify.bru` (renamed)

## Verification
1. `pnpm --filter @u-club/api test` — 112 tests pass
2. `pnpm lint` — clean
3. Manual: click forgot password → check Mailpit → click link → set new password → verify login with new password
