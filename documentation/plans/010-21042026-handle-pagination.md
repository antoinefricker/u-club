# 010 - 21/04/2026 - Handle Pagination

Add offset-based pagination to every API `GET list` route and wire the PWA list views to paginated data via TanStack Query + Mantine.

## Goals

- Every `GET` list route accepts `?page=<n>&itemsPerPage=<n>` query params.
- Every list response returns `{ data, pagination }` so the PWA can render totals.
- Every admin list view in the PWA uses Mantine's `Pagination` component and preserves smooth transitions via TanStack Query's `placeholderData: keepPreviousData`.
- Pagination state **and** existing list filters are URL-synced so list views are deep-linkable and share-able.
- Scope strictly limited to pagination + URL-syncing of already-existing filters. No new sorting, no new filtering logic.

## Design

### Query params

- `page` (integer, ≥ 1, default `1`) — 1-indexed, human/URL-friendly.
- `itemsPerPage` (integer, ≥ 1, ≤ 100, default `25`).
- Invalid/out-of-range values → `400 Bad Request` (Zod-validated).

### Response shape

Current list routes return a bare array. This plan introduces an envelope — **this is a breaking change** for every list consumer:

```json
{
  "data": [ /* ... resources ... */ ],
  "pagination": {
    "page": 1,
    "itemsPerPage": 25,
    "totalItems": 142,
    "totalPages": 6
  }
}
```

### Stable ordering

Offset pagination without a deterministic `ORDER BY` can shuffle rows between page requests. Each paginated route must apply a deterministic order (default `ORDER BY id ASC`). Routes that already have an order clause keep it; others get `id ASC` as a minimum.

### Shared API helpers

Introduce reusable modules so each route change is small:

1. `apps/api/src/schemas/pagination.ts`
   - Zod schema `paginationQuerySchema` parsing `page` + `itemsPerPage` from `req.query`, coercing strings to numbers, applying defaults and max.
2. `apps/api/src/utils/pagination.ts`
   - `applyPagination(qb, { page, itemsPerPage })` → clones the Knex query to run a `count(*)` and applies `.limit().offset()` to the main query. Returns `{ data, totalItems }`.
   - `buildPaginationMeta({ page, itemsPerPage, totalItems })` → returns the `pagination` object including `totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))`.

### TanStack Query pattern (PWA)

Per TanStack Query v5 docs, the canonical paginated-table pattern is:

```ts
useQuery({
  queryKey: ['clubs', { page, itemsPerPage }],
  queryFn: () => fetchClubs({ page, itemsPerPage }),
  placeholderData: keepPreviousData,
})
```

- `keepPreviousData` avoids flicker when navigating pages.
- Pagination params go in the query key so cache keys stay distinct per page.
- When filters change (existing filters on teams/members), reset `page` to `1`.

### PWA URL-sync strategy

All list view state (pagination **and** existing filters) lives in the URL via React Router v7's `useSearchParams`. Decisions:

- **Hand-rolled hooks on `useSearchParams`** — no new dependency (rejected `nuqs` given the small surface area).
- **Shared (non-namespaced) param names** (`page`, `itemsPerPage`, plus existing filter names like `clubId`, `gender`, `teamId`). One list per page today, so no collisions.
- **Hide defaults.** A list on page 1 with default `itemsPerPage` and no filter has a clean URL (e.g. `/admin/clubs`). Only non-default values appear in the query string.
- **`replace: true` on every `setSearchParams` call.** Pagination and filter changes don't pollute browser history — the back button exits the list rather than stepping through every page click.
- **Defensive parsing.** Hand-edited URLs with invalid values (`?page=abc`, `?page=-1`, `?itemsPerPage=9999`, unknown enum values) are silently clamped/defaulted client-side. The API still validates as a second line of defense.

### PWA helpers

1. `apps/pwa/src/hooks/usePagination.ts` — hook returning `{ page, setPage, itemsPerPage, setItemsPerPage, resetPage }`. Defaults: `page=1`, `itemsPerPage=25`. URL-synced via `useSearchParams`:
   - Reads `page` / `itemsPerPage` from the URL on every render.
   - Setters call `setSearchParams(next, { replace: true })`, preserving other params (filters etc.).
   - Omits params equal to default when writing back.
   - Parses/clamps invalid values to defaults.
2. `apps/pwa/src/hooks/useListFilters.ts` (new, generic) — a thin helper that reads/writes a set of filter keys to `useSearchParams` using the same "hide defaults + replace + defensive parse" rules as `usePagination`. Each list page composes this with the exact filter keys it supports (e.g. teams page passes `['clubId', 'gender']`, members page passes `['teamId']`). Clubs page has no filters so it doesn't use this hook.
3. **Page reset on filter change.** Because filters now live in the URL alongside pagination, the filter setters in `useListFilters` strip `page` from the query string when a filter value changes — the natural way to reset to page 1 without a separate `resetPage()` call.
4. Update each resource hook (`useClubs`, `useTeams`, `useMembers`, …) to accept `{ page, itemsPerPage, ...filters }`, pass them as query params, and return the full envelope (`{ data, pagination }`).
5. Each admin list page renders Mantine `<Pagination>` in the footer wired to `pagination.totalPages` and the `setPage` callback.

## Affected files

### API

- **New**
  - `apps/api/src/schemas/pagination.ts`
  - `apps/api/src/utils/pagination.ts`
  - `apps/api/src/utils/pagination.test.ts`
- **Modified list routes** (query handling + response envelope + `@openapi`)
  - `apps/api/src/routes/clubs/list.ts`
  - `apps/api/src/routes/users/list.ts`
  - `apps/api/src/routes/teams/list.ts`
  - `apps/api/src/routes/members/list.ts`
  - `apps/api/src/routes/user-members/list.ts`
  - `apps/api/src/routes/invitations/listSent.ts`
  - `apps/api/src/routes/invitations/listReceived.ts` (if present)
  - `apps/api/src/routes/member-statuses/list.ts`
- **Tests updated** for each route above (new response shape + pagination cases).
- **Bruno** `documentation/bruno/**/list.bru` updated to include `?page=1&itemsPerPage=25` example query.

### PWA

- **New**
  - `apps/pwa/src/hooks/usePagination.ts`
  - `apps/pwa/src/hooks/useListFilters.ts`
- **Modified hooks**
  - `apps/pwa/src/hooks/useClubs.ts`
  - `apps/pwa/src/hooks/useTeams.ts`
  - `apps/pwa/src/hooks/useMembers.ts`
  - `apps/pwa/src/hooks/useUsers.ts` (if present)
  - `apps/pwa/src/hooks/useUserMembers.ts`
  - `apps/pwa/src/hooks/useInvitations*.ts`
- **Modified pages** (add Mantine `Pagination`, wire `usePagination`)
  - `apps/pwa/src/pages/admin/ClubsListPage.tsx`
  - `apps/pwa/src/pages/admin/TeamsListPage.tsx`
  - `apps/pwa/src/pages/admin/MembersListPage.tsx`
  - Any other list/admin pages consuming the paginated endpoints.

## Implementation steps

1. **Shared API helpers**
   - Write `paginationQuerySchema` + unit tests.
   - Write `applyPagination` + `buildPaginationMeta` + unit tests (covers empty result, partial last page, out-of-range page).
2. **Refactor API routes** one resource at a time (clubs → users → teams → members → user-members → invitations → member-statuses). For each:
   1. Parse query via `paginationQuerySchema`.
   2. Apply `applyPagination` to the Knex builder.
   3. Return `{ data, pagination }`.
   4. Update route tests (new response shape + new pagination cases — see testing plan).
   5. Update `@openapi` JSDoc: add `page` & `itemsPerPage` query parameters, update `responses.200.schema` to the envelope.
   6. Update `documentation/bruno/<resource>/list.bru` with the new query params.
3. **PWA helpers**
   - Write `usePagination` (URL-synced, replace, hide defaults, defensive parse).
   - Write `useListFilters` with the same rules; filter setters also strip `page` from the URL so pagination resets.
4. **PWA hooks** — refactor each resource hook to accept `{ page, itemsPerPage, ...filters }`, include them in the query key, return the envelope, use `placeholderData: keepPreviousData`.
5. **PWA pages** — per CLAUDE.md, propose the layout/preview for each admin list page before editing the component code. Migrate existing filter state from local `useState` to `useListFilters`. Wire `usePagination` + Mantine `<Pagination>`.
6. **CLAUDE.md** — add the "List routes" subsection under API Routes and the "List views" subsection under React Views (PWA) so the conventions land in the same PR as the helpers that enforce them.
7. **Validation** — run `pnpm lint` and the full test suite. Take screenshots of updated admin pages for the PR description.

## Testing plan

### API (per route)

- Default `page=1&itemsPerPage=25` when no query params.
- Respects `?page=2&itemsPerPage=10` — returns correct slice.
- `totalItems` matches row count (joins & filters preserved).
- `totalPages` is `ceil(totalItems / itemsPerPage)`, and `1` when empty.
- `page` beyond `totalPages` returns `data: []` with correct meta.
- `400` on `page=0`, negative values, non-numeric values, `itemsPerPage > 100`.
- Existing auth/role tests still pass.

### API helpers

- `paginationQuerySchema` — defaults, coercion, bounds.
- `applyPagination` — correct `count(*)`, `limit`, `offset` on both empty and populated tables.

### PWA

- Navigating pages shows previous data while loading (no flicker) — manual check.
- Clicking a page in `<Pagination>` updates the URL (`?page=N`) using `replace` (no extra history entry).
- `page` resets to `1` when any filter changes (the URL loses `page`, keeps filter params).
- Hand-crafted URLs with invalid `page` / `itemsPerPage` / filter values are clamped to defaults without errors.
- Defaults never appear in the URL (`/admin/clubs` stays clean on page 1).
- Query keys include pagination + filters so cache entries are distinct.
- Deep-linking: opening a URL like `/admin/teams?clubId=3&page=2` lands on that exact state.

## Open considerations

- No `X-Total-Count` header — we standardize on the body envelope for a single source of truth.
- Stable ordering is required for correctness; any route without an explicit order gets `ORDER BY id ASC`.
- Migrating existing filter state (currently local `useState`) to the URL is a minor scope expansion beyond "pagination only" — required to make page-reset-on-filter-change fall out naturally and to keep deep-links consistent.
