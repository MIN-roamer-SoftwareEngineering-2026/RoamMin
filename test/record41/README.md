# Issue #41 — Trip detail verification

Feature branch: `feat/trip-detail-page` (based on `main@bfd124d`).

## Acceptance coverage

| Requirement | Implementation / verification |
| --- | --- |
| Click a trip in `/trips` | Link card routes to `/trips/:id`; covered by browser test. |
| Title, destination, dates, member count | Detail and member APIs; integration tests passed. Browser assertions included. |
| Places and expenses | Places placeholder and existing `TripExpensePanel`; browser assertions included. |
| Missing / inaccessible trip | API returns HTTP 404; translated error state and return link; integration tests passed. Browser assertions included. |
| Refresh and direct URL | Fetch by URL ID after session hydration; browser test reloads the owner and member pages. |
| Chinese and English | Localized UI and error messages; browser checks both languages. |

## Verification on 2026-11-25

- `npm run lint`: passed.
- `npm run build`: passed.
- Prettier check for the changed frontend files: passed.
- `mvn -o compile` and `mvn -o test-compile`: passed.
- `TripDetailApiTest`: all three methods passed using the Spring TestContext and MockMvc with the in-memory H2 database (the normal Maven Surefire plugin was not in the offline cache).
- Full `mvn test` and browser E2E: not run successfully in this environment. The Maven Surefire and Playwright dependencies are missing, and loopback connections needed to start the application are unavailable.

## Browser regression and screenshots

Once the application's local backend and frontend are running and the two test accounts are configured using `frontend/.env.e2e.example`, run from `frontend`:

```sh
npx playwright test --project=main e2e/trip-detail.spec.ts
```

Install the project's dependencies and Playwright Chromium beforehand if needed (`npm ci`, `npx playwright install chromium`). The test creates its own fixture trip, checks navigation, permissions, refresh, member count, the expense dialog, and Chinese/English labels. It automatically captures two screenshots in the Playwright test output directory:

- `01-trip-detail.png` — trip with data and two members.
- `02-trip-unavailable.png` — missing trip with a clear localized error.

Copy the screenshots into this directory after a successful browser run. Screenshots are still pending; no mock screenshots are presented as end-to-end evidence.
