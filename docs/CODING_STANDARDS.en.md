# RoamMin Team Coding Standards

[中文版](CODING_STANDARDS.md)

These standards apply to the React and TypeScript frontend, the Java 17 and Spring Boot backend, and the project documentation during the MIN-roamer Alpha Sprint. The Java guidelines draw on the [Alibaba Java Development Manual, Ultimate Edition v1.3.0](https://developer.aliyun.com/special/tech-java).

## General Conventions

- Use UTF-8. Format new frontend code with Prettier and indent Java code with four spaces. Keep formatting changes within the files touched by the pull request.
- Use PascalCase for classes and React components, such as `TripService` and `UserSearch`. Use camelCase for variables, functions, and JSON fields, such as `tripId` and `listMembers`. Use UPPER_SNAKE_CASE for Java constants, such as `MAX_AVATAR_BYTES`. Choose names that describe their purpose.
- Give each function one responsibility. Use comments to explain business constraints or design decisions, such as who can see a private trip. Remove obsolete code and unused imports.

## React and TypeScript

- Put reusable components in `frontend/src/components` and pages in `frontend/src/pages`. Keep API calls in `frontend/src/api` and use the existing HTTP client to handle authentication credentials and responses.
- Maintain shared request and response types in `frontend/src/types.ts`. Use precise types for component props and API data. Where the input type is uncertain, narrow `unknown` before use.
- Show distinct loading, empty, and error states for asynchronous lists. Give users feedback after profile saves and invitations, and prevent duplicate submissions while a request is in progress. Update Chinese and English translation resources together when adding interface text.

## Java and Spring Boot

- Controllers receive requests, validate DTOs, and delegate to services. Services handle permissions, business rules, and writes that need to be atomic. Repositories handle data access.
- Use constructor injection. Define DTOs for API inputs and outputs and use Bean Validation for request fields. Check on the server whether the current user can access the resource or change its membership.
- Use appropriate HTTP statuses for invalid parameters, permission failures, and duplicate operations. Route business exceptions through the shared exception handler and give callers the information they need to act. Check existing callers before changing an endpoint.

## API and Data

- Use the `/api/v1` prefix and the `{code, message, data}` response envelope. On success, set `code` to `0`. For errors, use the appropriate HTTP status, such as `401` for missing authentication, `403` for insufficient permission, and `409` for a duplicate invitation.
- When request or response fields change, update the frontend types, affected callers, and [API documentation](API.md) in the same pull request. For example, `POST /api/v1/trips/{tripId}/members` accepts a `username`, and the service checks trip ownership using the authenticated identity.
- Keep secrets, tokens, passwords, local databases, and test artifacts in local environments. Use temporary accounts for tests and demos, and check code, logs, and screenshots for sensitive fields before sharing them.

## Git Workflow and Pre-Submission Checks

1. Branch from the integration baseline agreed by the team. Use `feat/<module>-<summary>` for features, `fix/<module>-<summary>` for fixes, and `docs/<summary>` for documentation. Use `main` for demo versions and merge via pull requests. The project development plan designates `develop` for routine integration. Once available, use it as the target for feature pull requests.
2. Give each commit a clear purpose, such as `fix: clarify the duplicate invitation message`. Link the relevant Issue in the pull request and describe the changes, verification steps, and results. Team lead Chen Hang reviews all tasks. After review, someone with repository merge access merges the pull request.
3. For frontend changes, run `npm run lint` and `npm run build` in `frontend`, and check the changed source files with Prettier. For backend changes, run `mvn test` in `backend`. Add relevant regression checks for changes involving state, permissions, or data writes.
4. For invitation changes, use separate owner and invitee accounts to check trip creation, invitations, duplicate invitations, member removal, and the joined-trip list after a refresh. Record the observed results. For automated checks, document which cases ran and how many passed or failed.
