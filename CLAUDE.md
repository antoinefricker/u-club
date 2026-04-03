# Project Guidelines

## Commits

- Use conventional commits (e.g. `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- Do not add co-author lines to commits

## Code Quality

- Always run linter and prettier after editing a file

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

## Communication

- Explain bash commands succinctly when asking for validation
