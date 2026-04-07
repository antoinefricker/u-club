# Project Guidelines

## Planning

When planning a non-trivial feature

- always save the plan to `documentation/plans/<index>-<DD/MM/YYYY>-<topic>.md` so the user can review it.
- update `index.md` listing existing files in `documentation/plans/`

## Commits

- Use conventional commits (e.g. `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- Do not add co-author lines to commits
- Always propose the commit message and wait for user approval before committing

## Code Quality

- Always run linter and prettier after editing a file
- Always run `pnpm lint` before committing to catch unused imports and other issues

## API Routes

When creating or editing an API route, always follow this workflow:

1. **Write/update the route** implementation
2. **Suggest a list of tests** covering happy paths, validation errors, and error responses
3. **Ask the user for any additional edge cases** they can think of before writing tests
4. **Write/update the tests** incorporating all cases
5. **Update the OpenAPI annotation** (`@openapi` JSDoc) on the route to reflect any changes to request/response schemas, status codes, or descriptions
6. **Update the Bruno file** (`apps/api/bruno/`) for the route so it stays in sync with the implementation

## Database

When creating or editing a migration or any database schema change:

1. **Update `database-diagram.mermaid`** at the project root to reflect the new or modified tables, columns, and relationships
2. **Display the updated diagram** to the user so they can review it visually

## React Views (PWA)

When creating or editing views in the PWA app:

1. **Always use Mantine** components and hooks — do not use raw HTML or other UI libraries
2. **Propose a preview first** — before writing any component code, describe the planned layout, components, and interactions to the user so they can validate the approach
3. **Only create the content after the user approves** the proposed preview

## Pull Requests

- Do not create a PR unless the user explicitly asks for it
- When creating a pull Request, generate a summary section and a test plan section formatted as a todo checklist. Do not check any items in the test plan — leave them all unchecked.
- When working on PWA pages, take screenshots of edited pages and include them in the PR description.

## Makefile

When creating or editing a Makefile command, always update the Makefile documentation in `README.md` to reflect the change.

## Communication

- Explain bash commands succinctly when asking for validation
