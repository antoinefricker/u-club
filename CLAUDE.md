# Project Guidelines

## Before coding

- Always ask the user whether a plan is required before starting non-trivial work.
- When a plan is requested, write it to `documentation/plans/<index>-<DD/MM/YYYY>-<topic>.md` so the user can review it.
- Update `documentation/plans/index.md` to list the new plan file.

## Commits

- Use conventional commits (e.g. `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- Do not add co-author lines to commits.
- Always propose the commit message and wait for user approval before committing.

## Code Quality

- Always run linter and prettier after editing a file.
- Always run `pnpm lint` before committing to catch unused imports and other issues.

## API Routes

When creating or editing an API route, always follow this workflow:

1. **Write/update the route** implementation.
2. **Suggest a list of tests** covering happy paths, validation errors, and error responses.
3. **Ask the user for any additional edge cases** they can think of before writing tests.
4. **Write/update the tests** incorporating all cases.
5. **Update the OpenAPI annotation** (`@openapi` JSDoc) on the route to reflect any changes to request/response schemas, status codes, or descriptions.
6. **Update the Bruno file** (`apps/api/bruno/`) for the route so it stays in sync with the implementation.

### List routes

- Always paginated via `?page=<n>&itemsPerPage=<n>` (1-indexed; defaults `page=1`, `itemsPerPage=25`; max `itemsPerPage=100`; Zod-validated).
- Response envelope: `{ data, pagination: { page, itemsPerPage, totalItems, totalPages } }`. Never return a bare array.
- Must apply a deterministic `ORDER BY` (default `id ASC`) — offset pagination without stable ordering is incorrect.
- Use the shared helpers (`paginationQuerySchema` in `apps/api/src/schemas/pagination.ts` and `applyPagination` / `buildPaginationMeta` in `apps/api/src/utils/pagination.ts`) rather than reimplementing pagination inline.

## Database

When creating or editing a migration or any database schema change:

1. **Update `database-diagram.mermaid`** at the project root to reflect the new or modified tables, columns, and relationships.
2. **Display the updated diagram** to the user so they can review it visually.

## React Views (PWA)

When creating or editing views in the PWA app:

1. **Always use Mantine** components and hooks — do not use raw HTML or other UI libraries.
2. **Propose a preview first** — before writing any component code, describe the planned layout, components, and interactions to the user so they can validate the approach.
3. **Only create the content after the user approves** the proposed preview.

### List views

- All list view state (pagination + filters) lives in the URL via React Router's `useSearchParams`, not in local `useState`. Use the shared hooks `usePagination` and `useListFilters` (`apps/pwa/src/hooks/`).
- `setSearchParams` always uses `{ replace: true }` so page/filter changes don't pollute browser history.
- Hide default values from the URL (page 1, default `itemsPerPage`, empty filters produce a clean URL).
- Resource fetching hooks use `placeholderData: keepPreviousData` and include pagination + filters in the query key (`['<resource>', { page, itemsPerPage, ...filters }]`).
- Changing a filter must reset `page` to 1 (naturally handled by `useListFilters` stripping `page` from the URL on filter change).

## Pull Requests

- Do not create a PR unless the user explicitly asks for it.
- Do not add Claude co-authoring or attribution in the PR description.
- When creating a PR, generate a summary section and a test plan section formatted as a todo checklist. Leave all test plan items unchecked.
- When working on PWA pages, take screenshots of edited pages and include them in the PR description.
- To set or update a PR body, use `gh api -X PATCH repos/<owner>/<repo>/pulls/<n> -F body=@file.md` — `gh pr edit --body` fails on this repo due to a GraphQL `projects classic` deprecation.

## Makefile

- When creating or editing a Makefile command, always update the Makefile documentation in `README.md` to reflect the change.

## Communication

- Always explain bash commands succinctly before running them.
