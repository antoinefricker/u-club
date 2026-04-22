# 011 - 22/04/2026 - Team Categories CRUD + Team Form Select

Add a full CRUD API resource for `team_categories` (the table already exists in the schema) and wire a category Select into the team create/edit form in the PWA.

## Motivation

Teams have a `category_id` column, but:
- The create/update team Zod schemas and route logic silently drop `categoryId` (it's not in the schema, so `validate` strips it).
- There is no API endpoint to list team categories, so the PWA can't populate a Select for the field.

Net effect: you can see `categoryLabel` on the list/show team pages, but you cannot set or change it from the UI. This plan closes that loop.

## Scope

### API — new `/team-categories` resource

Mirrors the `/member-statuses` pattern (similar shape: small CRUD, no nesting).

- **Files**
  - `apps/api/src/routes/team-categories/index.ts`
  - `apps/api/src/routes/team-categories/list.ts`
  - `apps/api/src/routes/team-categories/get.ts`
  - `apps/api/src/routes/team-categories/create.ts`
  - `apps/api/src/routes/team-categories/update.ts`
  - `apps/api/src/routes/team-categories/delete.ts`
  - `apps/api/src/routes/team-categories/team-categories.test.ts`
  - `apps/api/src/schemas/teamCategory.ts` — `createTeamCategorySchema`, `updateTeamCategorySchema`
- **Register** the router in `apps/api/src/app.ts` under `/team-categories`.
- **Swagger** (`apps/api/src/swagger.ts`): add `TeamCategory`, `CreateTeamCategoryRequest`, `UpdateTeamCategoryRequest`.
- **Bruno** (`documentation/bruno/team-categories/`): `list.bru`, `get.bru`, `create.bru`, `update.bru`, `delete.bru`.

### Routes

- `GET /team-categories` — admin/manager, paginated envelope (via shared helpers), filterable by `?clubId=<uuid>`. Deterministic `ORDER BY id ASC`.
- `GET /team-categories/:id` — admin/manager. 404 when missing.
- `POST /team-categories` — admin/manager. Body: `{ clubId, label }`. 400 on missing/invalid. 409 when a `(clubId, label)` row already exists (DB has `unique(['club_id','label'])`).
- `PUT /team-categories/:id` — admin/manager. Body: `{ label }`. 400 when empty. 404 when missing. 409 on duplicate within the same club.
- `DELETE /team-categories/:id` — admin/manager. 204 on success, 404 when missing. Existing teams referencing it are left alone; the FK uses `ON DELETE SET NULL`, so their `category_id` becomes `NULL`.

### Teams: accept `categoryId` in create/update

Required for the Select to actually persist; today it's silently dropped.

- `apps/api/src/schemas/team.ts` — extend both schemas: `categoryId: z.uuid().nullable().optional()`.
- `apps/api/src/routes/teams/create.ts` — include `categoryId` in destructure + insert. Include in `.returning(...)`.
- `apps/api/src/routes/teams/update.ts` — `.returning(...)` to include `categoryId`. The handler already spreads `req.body` into `updates`, so adding the schema field is enough; just make sure the returning list includes `categoryId`.
- `apps/api/src/routes/teams/teams.test.ts` — extend POST/PUT cases to cover `categoryId` (happy path, null, invalid uuid).
- Swagger: add `categoryId` to `CreateTeamRequest` and `UpdateTeamRequest`.
- Bruno `documentation/bruno/teams/create.bru`/`update.bru` — include `categoryId` placeholder.

### PWA

- **New hook** `apps/pwa/src/hooks/useTeamCategories.ts`
  - `useTeamCategories({ clubId, page?, itemsPerPage? })` — paginated envelope consumer, matches other list hooks.
  - `enabled: !!clubId` so it doesn't fire until a club is chosen.
  - Query key includes `clubId`.
  - No mutations in this PR (admin UI for categories is a separate future feature).
- **TeamFormPage** (`apps/pwa/src/pages/admin/TeamFormPage.tsx`)
  - Initial form values gain `categoryId: ''`.
  - On edit, load `categoryId: team.categoryId ?? ''`.
  - New `<Select label="Category" clearable placeholder="No category" />` below "Club".
  - `data` is built from `useTeamCategories({ clubId: form.values.clubId, itemsPerPage: 100 }).data?.data`.
  - When `clubId` changes, reset `categoryId` to `''` (the previously-selected category may not belong to the new club).
  - On submit, send `categoryId: values.categoryId || null`.

### Out of scope

- Admin CRUD UI for categories (list/form pages in the PWA + navigation).
- Bulk operations, import/export.
- Moving a category between clubs.

## Testing plan

### API team-categories route (per CLAUDE.md List routes workflow)

- `GET /team-categories` — defaults, pagination, `?clubId=` filter, empty result, 400 on invalid pagination, `ORDER BY id ASC`.
- `GET /team-categories/:id` — 200 happy, 404 missing.
- `POST /team-categories` — 201 happy, 400 missing label / clubId / non-uuid clubId, 409 duplicate `(clubId, label)`.
- `PUT /team-categories/:id` — 200 happy, 400 empty body, 404 missing, 409 duplicate label within same club.
- `DELETE /team-categories/:id` — 204 happy, 404 missing.
- Auth: 401 unauthenticated, 403 regular user.

### API teams (existing)

- `POST /teams` — accepts `categoryId: <uuid>`, accepts `categoryId: null`, rejects non-uuid.
- `PUT /teams/:id` — same cases.
- Existing list/get/filter tests still pass.

### PWA (manual)

- Opening the create team form: Category disabled/empty until a Club is picked; then shows that club's categories.
- Switching the Club resets the Category.
- Saving with/without a category persists correctly.
- Opening the edit form for a team with a category: Category pre-selected.

## Implementation steps

1. **API schema + migration check**: confirm no migration needed (`team_categories` already exists). Add Zod schema file.
2. **API routes**: create the six files + tests, mirroring member-statuses. Run lint + tests.
3. **Register router** in `app.ts`; add swagger schemas; add Bruno collection.
4. **Extend team schemas/routes** to accept `categoryId`; update tests; update swagger + team Bruno files.
5. **PWA `useTeamCategories` hook** — list only.
6. **PWA TeamFormPage** — preview layout first per CLAUDE.md, then wire the Select.
7. **Validation** — `pnpm lint`, `pnpm -r typecheck`, API test suite.

## Open considerations

- **Category admin UI**: deferred. With no admin page, categories are only created via API (or seeded). Acceptable as a stopgap.
- **Uniqueness scope**: `(clubId, label)` — matches DB unique constraint.
- **Delete semantics**: FK `ON DELETE SET NULL` — deleting a category doesn't cascade to teams, just clears the field. No warning prompt needed in this PR since there is no admin UI yet.
