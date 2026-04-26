# Project Guidelines

## Before coding

- Always ask the user whether a plan is required before starting non-trivial work.
- When a plan is requested, write it to `documentation/plans/<index>-<DD/MM/YYYY>-<topic>.md` so the user can review it.
- Update `documentation/plans/index.md` to list the new plan file.

## Commits

- Use conventional commits (e.g. `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- Do not add co-author lines to commits.
- Always propose the commit message and wait for user approval before committing.
- When implementing a plan from `documentation/plans/`, split the work into one commit per top-level section of the plan (e.g. a separate commit for the API change, the API tests, the PWA hook, the PWA view, etc.) rather than bundling everything into one commit.
- Commit the plan file (and the `index.md` entry) as `docs: add plan NNN — Title` BEFORE the implementation commits, so the plan is visible to anyone bisecting the branch.

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

## Testing

### Mock isolation in vitest

The repo's API test files mock `db()` at module scope and rely on `beforeEach` to reset state. Two pitfalls:

- **Prefer `vi.resetAllMocks()` for new test files** — it clears call history *and* the `mockResolvedValueOnce` queue, so leftover values can't bleed into the next test. Reserve the `vi.clearAllMocks()` + per-mock `mockReset()` workaround only for files that already use `clearAllMocks` and where switching wholesale would break unrelated tests; in that case `mockReset()` the mocks used with `mockResolvedValueOnce` (typically `mockFirst`, `mockOffset`, `mockReturning`, `mockDel`).
- Test JWT subjects must be valid UUIDs whenever the route validates the corresponding param with `z.uuid()`. Use real UUIDs (e.g. `'11111111-1111-1111-8111-111111111111'`) for `createTestToken`, not fake strings like `'uuid-1'`.

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

### React contexts

When creating or refactoring a React context, follow the `AuthContextProvider` / `useAuthContext` pattern:

- Provider component: `XxxContextProvider` (not `XxxProvider`), in `XxxContextProvider.tsx`.
- Hook: `useXxxContext` (not `useXxx`), co-located with the `XxxContextValue` type and `createContext` call in `useXxxContext.ts` — all three live together, no separate `xxxContextValue.ts` file.
- The hook throws when used outside the provider, with a message naming both `useXxxContext` and `XxxContextProvider`.

### Domain types

- Domain/resource types (server entities like `Team`, `Club`, `Member`, `TeamGender`, …) live in `apps/pwa/src/types/`, one file per entity named after the type (e.g. `types/Team.ts`). Do not define them inline in hooks.

### React 19 strict effects

ESLint's `react-hooks/set-state-in-effect` forbids `useState` setters inside `useEffect`. The "reset modal state on close" pattern (`useEffect(() => { if (!opened) reset(); }, [opened])`) trips it. Two valid fixes:

- **Conditionally render the modal from the parent** (`{opened && <Modal onClose={…} />}`) so each open mounts a fresh component instance. Simplest, but loses Mantine's exit animation since the component unmounts immediately.
- **Keep the modal always rendered** with a `key` prop that changes on each open (e.g. `key={openCount}` where the parent increments `openCount` on every open). Each open swaps the key and remounts the children while preserving the wrapper's open/close transition.

## Pull Requests

- Do not create a PR unless the user explicitly asks for it.
- Do not add Claude co-authoring or attribution in the PR description.
- When creating a PR, generate a summary section and a test plan section formatted as a todo checklist. Leave all test plan items unchecked.
- Before writing the PR body, run the test suite and record the current test instrumentation in the summary: total tests passing (e.g. `308 passing`) and how many tests this PR adds, so reviewers can see how coverage moved.
- To set or update a PR body, use `gh api -X PATCH repos/<owner>/<repo>/pulls/<n> -F body=@file.md` — `gh pr edit --body` fails on this repo due to a GraphQL `projects classic` deprecation.

## Makefile

- When creating or editing a Makefile command, always update the Makefile documentation in `README.md` to reflect the change.

## Communication

- Always explain bash commands succinctly before running them.
