# 012 - 22/04/2026 - Admin Members Search

Add a free-text search filter on the admin members list that matches a partial token against first name, last name, or birthdate (as displayed, `DD/MM/YYYY`).

## Motivation

The admin members list currently only supports filtering by team. With a growing dataset it becomes tedious to locate a specific person. A single search box covering the three most identifying fields (first name, last name, birthdate) is the minimum useful improvement.

## Scope

### API — extend `GET /members`

- **File**: `apps/api/src/routes/members/list.ts`
- **New query param**: `?search=<string>`, optional.
  - Zod validation: `z.string().trim().min(1).max(100)` when present; empty/whitespace is treated as "no filter" (not an error).
  - Tokenization: the trimmed value is split on whitespace (`/\s+/`). Empty tokens are dropped. A cap of **10 tokens** is enforced (400 when exceeded) to bound query complexity.
  - Wildcard characters in user input (`%`, `_`, `\`) are escaped before being embedded in each `ILIKE` pattern, so they behave as literals.
- **Matching logic** — **multi-token**, **case- and accent-insensitive**: every token must match at least one of the three fields (AND between tokens, OR between fields per token).
  ```sql
  WHERE
    (unaccent(first_name) ILIKE unaccent('%token1%')
     OR unaccent(last_name) ILIKE unaccent('%token1%')
     OR unaccent(to_char(birthdate, 'DD/MM/YYYY')) ILIKE unaccent('%token1%'))
    AND
    (... same for token2 ...)
    AND ...
  ```
  - Implementation: loop tokens, call `query.andWhere((sub) => sub.whereRaw(...).orWhereRaw(...).orWhereRaw(...))` once per token with the escaped `%token%` pattern.
  - `unaccent(...)` is provided by the Postgres `unaccent` extension (enabled by a dedicated migration). Both the column and the bound pattern are wrapped so `"lea"` matches `"Léa"`, `"francois"` matches `"François"`, etc.
  - `to_char(..., 'DD/MM/YYYY')` is Postgres-specific (client is `pg`, confirmed in `knexfile.js`). Dates have no accents so wrapping the birthdate branch in `unaccent()` is a no-op but kept for symmetry.
  - Null `birthdate` values produce `NULL` from `to_char`, which doesn't match the `ILIKE` — that's correct (those members simply can't be matched by birthdate, but still match on names).
  - Example: `search=john 1990` → rows where "john" appears in first/last name OR "1990" appears in the formatted birthdate, AND "1990" appears in first/last name OR "1990" appears in the formatted birthdate. In practice this matches members named John born in 1990 (each token hits a different field).

### Database migration — enable `unaccent`

- New migration `apps/api/src/migrations/20260422_02_enable_unaccent_extension.ts` with `CREATE EXTENSION IF NOT EXISTS unaccent` (up) / `DROP EXTENSION IF EXISTS unaccent` (down).
- No changes to tables or columns, so the `database-diagram.mermaid` does not need updating.
- Caveat: `CREATE EXTENSION` typically requires the DB role to be a superuser or have `CREATEROLE`-equivalent permissions. In shared/hosted environments the extension may need to be enabled out-of-band by the DBA before the migration runs.
- **Interaction with existing `teamId` filter**: ANDed — both can be active simultaneously.
- **Pagination**: unchanged. `applyPagination` counts on the filtered query, so `totalItems`/`totalPages` reflect the filtered set.
- **OpenAPI annotation** updated with the new param.
- **Bruno** `documentation/bruno/members/list.bru` — add `~search:` placeholder and docs line.

### PWA — members list page

- **File**: `apps/pwa/src/pages/admin/MembersListPage.tsx`
- **Hook** (`apps/pwa/src/hooks/useMembers.ts`): accept optional `search?: string`, thread through `queryKey` + `buildListQueryString`.
- Add `'search'` to `MEMBERS_FILTER_KEYS`. `useListFilters` already handles arbitrary string filters, so the URL plumbing is free (`?search=<value>`).
- Add a Mantine `<TextInput>` in `<ListFilters>`, to the left of the team `<Select>`:
  - `label="Search"`, `placeholder="Name or birthdate (DD/MM/YYYY)"`.
  - Left icon: `<IconSearch />` for affordance.
  - `rightSection`: a clear button (`<ActionIcon>` with `<IconX />`) visible when input is non-empty.
  - Width: `maw={320}` (roughly matching the team select).
- **Debounce**: use `@mantine/hooks`' `useDebouncedValue` with a 300 ms delay. The text input itself is controlled via local state for snappy typing; the URL param (and therefore the query) only updates once the debounced value settles. This keeps the URL stable while typing and avoids firing a request per keystroke.
- On first render, seed the local input state from `filters.search ?? ''` so the field reflects what's in the URL (e.g. after a refresh or shared link).
- Changing the search resets `page` to 1 — handled naturally by `setFilter` stripping `page` from the URL.

### Out of scope

- Searching other member fields (phone, email via user, gender).
- Server-side ranking/relevance.
- Quoted phrase tokens (e.g. `"John Smith"` as one token). v1 splits on any whitespace.

## Testing plan

### API `GET /members?search=...`

- Single-token matches on first name (case-insensitive, partial).
- Single-token matches on last name (case-insensitive, partial).
- Matches on full birthdate in `DD/MM/YYYY`.
- Matches on partial birthdate components: `22/04`, `1990`, `04/1990`.
- **Multi-token AND** — `search=john 1990` matches a member where one token hits the name and the other hits the birthdate; does NOT match a member whose name matches `john` but whose birthdate doesn't contain `1990`.
- Extra whitespace (leading/trailing/internal) is collapsed — `"  john   1990  "` behaves like `"john 1990"`.
- Empty / whitespace-only `search` behaves like no filter (200, all members).
- Excess length returns 400 (`search` > 100 chars).
- Too many tokens returns 400 (> 10 tokens).
- Wildcard chars in input are escaped: `search=%` does NOT return all members; it matches only rows whose value literally contains `%`. Same for `_` and `\`.
- Combines with `teamId`: both ANDed.
- Pagination reflects the filtered set (`totalItems` / `totalPages` recomputed).
- Auth: existing 401/403 behavior unchanged.

### PWA (manual)

- Typing in the search box does not fire a request on each keystroke (debounce verified via network tab).
- URL updates to `?search=<value>` 300 ms after typing stops; `page` is dropped.
- Clear button clears the input, removes `?search=` from the URL, and restores the unfiltered list.
- Refreshing with `?search=jo` in the URL shows `jo` in the input and the filtered list.
- Search combined with a team filter narrows both.
- Typing a birthdate like `22/04/1990` returns the expected member(s).
- Typing `lea` returns `"Léa"`; typing `francois` returns `"François"`.

## Implementation steps

1. **Migration**: add `20260422_02_enable_unaccent_extension.ts` and run it against the dev DB.
2. **API**: extend `list.ts` with the `search` param + escaping helper + `unaccent`-wrapped `whereRaw` clauses. Update OpenAPI. Update Bruno.
3. **API tests**: add the cases listed above to `members.test.ts`.
4. **PWA hook**: extend `useMembers` with `search`.
5. **PWA page**: preview the layout change with the user first (per CLAUDE.md React Views rule), then wire the `<TextInput>` + debounce.
6. **Validate**: `pnpm lint`, `pnpm -r typecheck`, API test suite.

## Decisions

- **Multi-token**: enabled. Whitespace-split; each token must match at least one of `first_name` / `last_name` / formatted `birthdate`.
- **Wildcard escaping**: enabled. `%`, `_`, and `\` in user input are treated as literals.
- **Accent-insensitive**: enabled via the Postgres `unaccent` extension (new migration).

## Open considerations

- **Search across more fields**: phone, email, gender — deferred until asked.
- **Index**: for large datasets a trigram index on `first_name`, `last_name` would make `ILIKE '%...%'` fast. Out of scope for v1; revisit when perf shows a problem. Note that once `unaccent()` is applied, a plain column index cannot help — an expression index on `unaccent(first_name)` (marked `IMMUTABLE`) would be needed.
