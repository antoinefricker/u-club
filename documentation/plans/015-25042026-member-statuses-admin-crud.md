# 015 - 25/04/2026 - Member Statuses Admin CRUD (PWA)

Add an admin UI in the PWA to manage member statuses (list + create/edit/delete), and complete the API with the missing `GET /member-statuses/:id` route.

## Motivation

Member statuses are a small reference entity (`{ id, label }`) consumed by the admin member form (`MemberFormPage`). Today:

- The API exposes `list`, `create`, `update`, `delete` for `/member-statuses` — but no `GET /member-statuses/:id`. Every other admin entity (clubs, teams, team-categories, members) has one, and it's needed by an edit form that loads the row by URL param.
- The PWA only has a `useMemberStatuses` list hook. There is no list page, no form page, no nav entry, no mutation hooks.

Net effect: statuses can only be created/edited via direct API calls or seed scripts. This plan closes that loop and matches the look/feel of the existing CRUD pages (Clubs, Teams, Team Categories).

## Scope

### API — add `GET /member-statuses/:id`

Mirrors the get-by-id pattern used by other resources (e.g. `team-categories/get.ts`).

- **Files**
  - `apps/api/src/routes/member-statuses/get.ts` — new.
  - `apps/api/src/routes/member-statuses/index.ts` — register the new sub-router.
  - `apps/api/src/routes/member-statuses/member-statuses.test.ts` — extend with happy-path + 404 + auth cases.
- **Behavior**
  - `GET /member-statuses/:id` — `requireAuth` + `requireRole('admin', 'manager')` to match the list route. Returns `{ id, label }`. 404 when missing.
- **Swagger** (`apps/api/src/swagger.ts`): the `MemberStatus` schema already exists; add the new path block alongside the others.
- **Bruno** (`documentation/bruno/member-statuses/`): add `get.bru` next to the existing files.

### PWA — extend `useMemberStatuses.ts`

Today the file exports only `useMemberStatuses` (paginated list). Extend it to mirror `useTeamCategories.ts`:

- `useMemberStatus(id: string)` — single-item fetch, `enabled: !!id`, query key `['member-statuses', id, token]`.
- `useCreateMemberStatus()` — `POST /member-statuses`, invalidates `['member-statuses']` on success.
- `useUpdateMemberStatus()` — `PUT /member-statuses/:id`, invalidates `['member-statuses']`.
- `useDeleteMemberStatus()` — `DELETE /member-statuses/:id`, invalidates `['member-statuses']`.

Use `useAuthHeaders` (same helper used by other mutation hooks).

### PWA — `MemberStatusesListPage`

`apps/pwa/src/pages/admin/MemberStatusesListPage.tsx`. Mirrors `TeamCategoriesListPage` but simpler (no filters since the entity has no filterable column).

- `PageTitle "Member statuses"` with a `New status` button → `/admin/member-statuses/new`.
- No `<ListFilters>` block.
- `Table` columns:
  - **Label** — rendered as `Anchor component={Link} to={/admin/member-statuses/:id} c="inherit" underline="hover" size="sm"` (matches the linked-label convention from PR #38).
  - actions column with right-aligned `Edit` / `Delete` `ActionIcon`s.
- Pagination via `usePagination` + `ListPagination`. Empty state via `EmptyListRow`.
- Delete: `window.confirm` → `useDeleteMemberStatus().mutate` → `notifications.show` on success.

### PWA — `MemberStatusFormPage`

`apps/pwa/src/pages/admin/MemberStatusFormPage.tsx`. Mirrors `TeamCategoryFormPage`, but with a single `label` field (no `clubId`).

- `PageTitle` reads `New member status` or `Edit member status`.
- `FormWrapper` wraps the form.
- `Grid` + single `TextInput` on `label` (required, `v.trim()` validation).
- Action buttons via the right-aligned `Group` convention from PR #38: `Cancel` (subtle, → `/admin/member-statuses`) then `Save`/`Create` (primary).
- On submit: create → `useCreateMemberStatus`, edit → `useUpdateMemberStatus`. On success: notification + navigate back to list.
- On 409 from the API: surface the error in the form (like the other forms do).

### PWA — routing & nav

- `apps/pwa/src/main.tsx`: register
  - `Route path="member-statuses" element={<MemberStatusesListPage />}`
  - `Route path="member-statuses/new" element={<MemberStatusFormPage />}`
  - `Route path="member-statuses/:id" element={<MemberStatusFormPage />}`
- `apps/pwa/src/layout/AppNavigation.tsx`: add a `Member statuses` sub-link under the admin section, between `Team categories` and `Members`. Use `IconBadge` (or another available `@tabler/icons-react` icon — pick one consistent with the others).
- `apps/pwa/src/pages/admin/AdminDashboardPage.tsx`: **leave alone** — `Team categories` is only reachable via the nav today; mirror that.

### Out of scope

- Soft delete / archival of statuses.
- Cascade behavior on delete: members reference `statusId` via FK; existing migration likely has its own constraint (`SET NULL` or `RESTRICT`). We don't change that here; if a status is in use and the FK is `RESTRICT`, the API will already 409/500 and the UI will surface the error.
- Bulk operations, drag-to-reorder.
- Localization of the labels.

## Testing plan

### API — `member-statuses.test.ts`

Add cases for the new `GET /member-statuses/:id`:

- 200 happy: existing id returns `{ id, label }`.
- 404 when missing.
- 401 when unauthenticated.
- 403 for a regular user.

### PWA — manual

- `/admin/member-statuses` lists all statuses, paginated.
- Clicking a label opens the edit form pre-populated with the current label.
- Saving an edit returns to the list with a green notification.
- `New status` opens an empty form; submitting creates the row.
- Deleting from the list prompts a confirm; on confirm, the row disappears with a green notification.
- Creating a status whose label already exists shows the duplicate error.
- Nav: `Member statuses` sub-link is visible only for admins (admin section is already gated).

## Implementation steps

Each top-level section gets its own commit (per CLAUDE.md):

1. **API — `GET /member-statuses/:id`**: route file, register, swagger, Bruno, tests.
2. **PWA hooks**: extend `useMemberStatuses.ts` with `useMemberStatus`, `useCreateMemberStatus`, `useUpdateMemberStatus`, `useDeleteMemberStatus`.
3. **PWA — `MemberStatusesListPage`**: list page + route + nav entry.
4. **PWA — `MemberStatusFormPage`**: form page + create/edit routes.
5. **Validation**: `pnpm lint`, `pnpm -r run test`, manual smoke of the new screens.

## Open considerations

- **Delete with FK constraints**: depends on the migration. If `members.status_id` uses `ON DELETE RESTRICT`, deleting a status that's referenced will fail at the API. Acceptable for now — surface the error in the UI; revisit if it becomes painful.
- **Dashboard tile**: not adding one here so we mirror the current Team Categories treatment. Easy to add later if desired.
