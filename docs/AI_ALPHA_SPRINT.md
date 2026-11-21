# MIN-roamer AI Travel Assistant — Alpha Sprint report

EE308FZ Software Engineering, Fifth Assignment. Repository inspection, implementation and verification took place on November 21, 2026 (Asia/Shanghai). The sprint runs November 21–28. The submission deadline supplied in the brief is November 29 at 23:59.

## A. Repository analysis

The starting checkout was clean at `cddb26f` on `main`, tracking `origin/main`. The local remote-tracking refs also included `origin/ch`. Recent history was `cddb26f` (merge of existing PR #1), `b247298` (user module and theme support), and `22e3556` (initial commit). The working branch was created from this baseline. Existing work is attributed to the repository history.

| Directory | Observed implementation and tooling |
| --- | --- |
| `backend/` | Maven, Java 17 compilation target, Spring Boot 3.3.5, Spring MVC, Bean Validation, Spring Security 6.3.4, JPA/Hibernate, JJWT 0.12.6, and H2 2.2.224. The baseline production packages cover authentication, users, trip/social APIs, security, and shared response handling. |
| `frontend/` | npm lockfile with React 18.3.1, TypeScript 5.6.3, Vite 5.4.21 and React plugin 4.7.0, React Router 6.30.6, Axios 1.20.0, Zustand 4.5.7, i18next 23.16.8 with react-i18next 15.7.4, Tailwind 3.4.19, Phosphor 2.1.10, and ESLint 8.57.1. Leaflet, ECharts and dnd-kit are declared dependencies without matching domain feature implementations in the baseline. |
| `docs/` | Existing HTTP contract and user-module runbook with the documented Playwright checks. |
| `scripts/` and root | `Start-Local.ps1` and the Windows launcher start Vite and Spring Boot, obtain a local JWT signing key, and keep logs and secrets under ignored `.local/`. `README.md` provides manual startup instructions. No tracked GitHub Actions workflow, Maven wrapper, or CI config was present. |

- **Persistence and startup.** `backend/src/main/resources/application.yml` uses file-backed H2 with Hibernate schema update and the H2 console disabled. Browser QA used disposable in-memory H2 databases and separate avatar directories. The documented startup runs `mvn spring-boot:run` from `backend/` with a Base64 `JWT_SECRET` and `npm run dev` from `frontend/` after dependency installation. Default ports are 8080 and 5173.
- **Authentication.** `AuthService.register` normalizes email, checks uniqueness, and hashes passwords with BCrypt. `AuthService.login` verifies credentials and issues a signed JWT. `JwtAuthenticationFilter` extracts the signed user ID. `SecurityConfig` defaults to authenticated routes with explicit exceptions for registration, login, avatar reads, community reads, and preflight. Browser `authStore.ts` keeps the token in session storage, and `App.tsx` restores the user via `/auth/me`.
- **Navigation, HTTP and errors.** `App.tsx` uses React Router with `ProtectedRoute`, theme and language controls, and a signed-in sidebar. `http.ts` attaches the bearer token and unwraps `ApiResponse<T>`, handles 401 state reset, and localizes selected errors. `VITE_API_BASE_URL` can override the default `/api/v1` path, which Vite proxies to the backend. `GlobalExceptionHandler` maps domain exceptions, Bean Validation failures, persistence conflicts, oversized uploads, and unexpected errors to response envelopes.
- **Tests at baseline.** Maven already included Spring Boot Test and Spring Security Test, and Surefire reported zero backend tests. The frontend had build/type-check and lint scripts, and a standalone Playwright user regression with an externally supplied browser package. There was no tracked frontend test runner dependency.

### Functional module status before AI development

| Module | Classification | Source and verification |
| --- | --- | --- |
| User and personal profile | Implemented and verified | `AuthController` and `AuthService` implement registration, login and current user. `UserController`, `UserService.search` and `AvatarStorageService` implement profile updates, avatar storage and username search. The existing browser regression passed registration validation, login/logout, session restoration and retry, avatar upload, profile save, and user search. |
| Trip planning | Partially implemented | `TripService.create` validates dates and saves private trip records through JPA. `TripService.mine` lists owned and shared trips, and `publish` changes visibility. `MyHomePage` provides trip creation and owned/joined views, exercised by the browser regression. The trip entity has title, destination and dates. General trip editing, trip deletion, and day-by-day scheduling were absent. |
| Destination information | Not implemented | No attraction, restaurant, place search, weather or map routes, services, entities or UI pages. Leaflet is present in the package manifest. |
| Budget and expenses | Not implemented | No expense model, budget calculations, expense APIs or charts. ECharts is present in the package manifest. |
| Community and social | Partially implemented | `SocialController` exposes public trip listings, public traveler profiles, favorites, buddy-post management and member management through `TripService` and `BuddyService`. The browser regression exercised the personal lists, public profile, favorites, and membership. The dedicated community square, comments/follows and shared itinerary editing were absent. |
| AI travel assistant | Not implemented at baseline | No AI routes, client, prompts, chat state, itinerary drafts, or AI-specific verification existed before this branch. |

The authenticated sidebar, common API envelope, and shared Axios client provided the integration points. The available trip API supported basic records and member permissions. Daily drafts could be added independently of that persistence model.

### Baseline builds and tests

Initial local shell attempts at `mvn clean package` and `npm ci && npm run build` stopped with command-not-found errors. JDK 21.0.11 was installed and compiled for release 17. A local Node 22.23.5 binary was available outside PATH. Maven 3.9.11 and npm 10.9.4 were bootstrapped under ignored `.local/ai-tools/`. The commands were rerun against an unmodified `git archive HEAD` snapshot under `.local/ai-baseline/`.

| Check | Baseline result |
| --- | --- |
| Backend `mvn -B -ntp -Dmaven.repo.local=<local-cache> clean package` | Build passed. 38 source files compiled. Surefire reported zero tests. |
| Frontend `npm ci`, `npm run build`, `npm run lint` | Locked install, TypeScript/Vite build and lint all passed. npm reported deprecations in the existing tooling dependencies. |
| `node scripts/verify-user-module.cjs` | Passed with local Vite, Spring Boot, an in-memory database, Playwright and Chrome. |

## B. AI architecture

The browser sends authenticated typed JSON requests through the existing Axios instance. `AiController` validates DTOs and reads the existing JWT principal. `AiService` builds server-owned system messages, adds bounded user context, and validates model output. `AiRequestLimiter` gates calls by signed-in account, process-wide frequency and active provider requests. `QwenClient` uses Java's existing HTTP client and the application's Jackson mapper to call a configurable HTTPS Chat Completions endpoint. Spring Boot Test, MockMvc and the existing Playwright script convention cover tests. Production and package-lock dependencies are unchanged.

| SRS | Delivered behavior |
| --- | --- |
| FR-AI-01 | `POST /api/v1/ai/generate-itinerary` takes a destination, 1–14 days, optional CNY budget, preferences and requirements. It returns a validated day-by-day draft with activities, optional costs and travel tips. |
| FR-AI-02 | `POST /api/v1/ai/chat` accepts an ordered context of at most four completed exchanges, a new message, and optional travel context. The browser renders replies as plain text and keeps the transcript in page memory through mode switches. Clear, refresh, navigation away, and logout discard it. |
| FR-AI-03 | Both routes use existing JWT authentication and return `ApiResponse<T>`. Qwen settings live in backend environment variables. Structured mode uses `response_format: { "type": "json_object" }` with thinking disabled. [Alibaba Cloud Chat Completions](https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope) · [Qwen structured output](https://www.alibabacloud.com/help/en/model-studio/qwen-structured-output) |
| FR-AI-04 | Input/body and output limits, no redirects, deadlines, sanitized error envelopes, manual retries, shared quotas and travel-verification guidance. A per-process fixed window permits six calls per account and 30 overall every 60 seconds, with up to four in flight. |

See [setup, API examples and failure statuses](AI_ASSISTANT.md). The example uses CNY to keep optional budgets and activity costs in one currency. The default 45-second backend deadline leaves room for itinerary JSON, and the AI calls use a 65-second browser timeout. API configuration is checked when the feature is used so the existing application can run with AI settings empty.

## C. Implementation results

| Area | Files created | Existing files modified |
| --- | --- | --- |
| Backend | `backend/.env.example`, `ai/AiController.java`, `ai/AiRequestBodyAdvice.java`, `ai/AiRequestLimiter.java`, `ai/AiService.java`, `ai/QwenClient.java`, and `ai/dto/{ItineraryRequest,ItineraryDraft,ChatRequest}.java` under `backend/src/main/java/com/minroamer/` | `backend/src/main/resources/application.yml` |
| Frontend | `frontend/src/api/ai.ts`, `pages/AiAssistantPage.tsx`, `components/ai/{ItineraryGenerator,AiChatPanel}.tsx`, `ai.css`, and `ai-translations.ts` | `frontend/src/App.tsx`, `frontend/src/account.css`, `frontend/src/i18n.ts` |
| Tests | `backend/src/test/java/com/minroamer/ai/{AiEndpointsTest,QwenClientTest,AiRequestLimiterTest}.java`, test-only Mockito mock-maker configuration, and `frontend/scripts/verify-ai-assistant.cjs` | — |
| Documentation | `docs/AI_ASSISTANT.md`, `docs/AI_ALPHA_SPRINT.md` | `README.md`, `docs/API.md` |

The assistant is reachable at `/ai` through the existing sidebar. The page uses the application's theme tokens, Chinese/English translations, mobile layout and sign-in flow. Itinerary drafts and chat are independent of Trip records, JPA repositories and existing write APIs.

Planned integrations depend on other modules:

- **Save a draft or append activities.** Confirm the Trip owner's day/activity model, supported write endpoint and membership policy. Agree on how an explicit review and save action maps activities to dates and handles duplicates.
- **Connect places.** Confirm a destination search API that returns canonical place IDs and coordinates. Treat model-provided names as search inputs and let travelers confirm matches.
- **Display on a map.** Use confirmed place coordinates and the map team's display contract. Map and route estimates need their own data source.

## D. Test results

| Check | Recorded result |
| --- | --- |
| Backend `mvn -B -ntp -o -Dmaven.repo.local=<local-cache> clean package` | **36 passed, 0 failed, 0 skipped.** 22 MockMvc tests, 11 provider-client tests and 3 limiter tests. Executable JAR built. |
| Frontend `npm run build`, `npm run lint`, `node --check scripts/verify-ai-assistant.cjs` | Passed. Build includes TypeScript checking. |
| `node --test scripts/verify-ai-assistant.cjs` | **7 browser scenarios passed**. Node reported eight passing tests including the parent test. Coverage includes protected routing, invalid form fields, loading, authenticated payloads, draft rendering, retries, history order and truncation, clearing and refresh, API failure, language and dark mode at 320px. |
| `node scripts/verify-user-module.cjs` | Passed again on the feature branch. The same existing user/social regression also passed at baseline. |
| Local HTTPS smoke | Passed both real backend routes against a loopback Qwen-shaped server. Verified the provider request shape, itinerary and ordered chat responses, provider error redaction, timeout, invalid output handling, draft rendering in the browser, and an empty trip list before and after the AI requests. |
| Live Model Studio | Pending. No configured Model Studio key, endpoint or model was available in the local environment during verification. Provider access, live response quality, latency and regional quota remain unverified. |

The first test run exposed a brittle assertion comparing a JSON budget by its textual representation. The test now compares the numeric value. A sandboxed test run also blocked Mockito's default JVM agent attachment. The test-only subclass mock maker resolved that problem without a runtime dependency or production configuration change. Build and test outputs are recorded from the final runs.

## E. Git development record

Branch `feature/ai-assistant` was created from `main` at `cddb26f`. The feature and tests were committed locally.

| Commit | Subject | Associated GitHub issue |
| --- | --- | --- |
| `3cfb570` | `feat(ai): add authenticated Qwen itinerary and chat endpoints` | Pending assignment |
| `2434c48` | `feat(frontend): integrate bilingual AI travel assistant` | Pending assignment |

The documentation commit records this report. Use `git log -3 --oneline` to identify its revision and `git status --short --branch` to inspect the checkout. Git inferred the author and committer from the local machine. The team should verify the identity before publishing. Remote issues, PR and feature-branch publication remain pending.

### Proposed GitHub issues

Estimates represent proposed story points for planning. AI module ownership in the sprint brief identifies the AI module owner as the proposed assignee. Cross-module reviews can be requested from the respective owners.

| Proposed title | Description and acceptance criteria | Dependencies | Points | Proposed owner | SRS |
| --- | --- | --- | --- | ---: | --- | --- |
| Define AI module architecture and API contracts | Specify signed-in routes, request/response examples, standalone draft behavior, and failure statuses in project documentation. | Existing JWT, `ApiResponse<T>`, sprint requirements | 2 | AI module owner | FR-AI-01–04 |
| Integrate Qwen in the backend | Send OpenAI-compatible requests using server-side settings. Verify JSON mode, timeout, redacted failure handling and mock coverage. | Provider documentation, existing Jackson, Model Studio configuration for live verification | 3 | AI module owner | FR-AI-03, FR-AI-04 |
| Generate structured itinerary drafts | Validate trip inputs and returned days/activities. Display an independently reviewable draft and confirm that saved trips are unchanged. | AI contracts, provider client | 3 | AI module owner | FR-AI-01, FR-AI-04 |
| Implement multi-turn travel chat | Preserve user/assistant order, apply history bounds, render replies, and clear conversation state on request. | AI contracts, provider client | 3 | AI module owner | FR-AI-02, FR-AI-04 |
| Integrate the AI Assistant into the frontend | Add signed-in navigation, itinerary and chat panels, validation feedback, manual retry, both themes and both languages. | Existing router, translations and API client, AI endpoints | 3 | AI module owner | FR-AI-01, FR-AI-02, FR-AI-04 |
| Verify reliability and prepare sprint evidence | Cover JWT, validation, malformed model output, timeout, upstream failure and quota behavior. Record passing tests and screenshots and run a live configured smoke test. | Backend and frontend increments, Playwright, secure workspace credential | 3 | AI module owner | FR-AI-01–04 |

## F. Alpha Sprint evidence

| Evidence | Available now | Capture later |
| --- | --- | --- |
| Git | Local commits and clean tracked checkout after committing the report | Real issue URLs, PR URL and review/merge status after the team authorizes remote work |
| Browser | [Desktop itinerary](../frontend/artifacts/ai-assistant/itinerary-light.png), [mobile dark chat](../frontend/artifacts/ai-assistant/chat-dark-mobile.png), [browser-to-HTTPS-fixture itinerary](../frontend/artifacts/ai-assistant/itinerary-https-fixture.png) | A live-provider screenshot using test data after a credential-backed run |
| API | [Local HTTPS smoke responses](../.local/ai-evidence/https-smoke.txt) and error cases | Redacted examples from the actual Model Studio test |
| Build and tests | [Backend test summary](../.local/ai-evidence/backend-tests.txt), [frontend build and lint](../.local/ai-evidence/frontend-build-lint.txt), [AI browser run](../.local/ai-evidence/ai-browser.txt), [user regression](../.local/ai-evidence/user-regression.txt) | Re-run on the candidate revision before submission and capture any CI result that actually exists |
| Decisions and problems | Baseline inspection, missing PATH tools, test adjustment, Mockito sandbox fix, JSON validation, backend-only secrets and page-scoped chat | Live-provider behavior, teammate review notes, follow-up decisions and actual progress |

Evidence paths above refer to local ignored artifacts. Screenshots use disposable test accounts and fixture content. Keep the distinction between a local HTTPS fixture and a real Model Studio response when presenting results.

| Essay window | Evidence to record from work actually performed in that window |
| --- | --- |
| November 21–22 | Baseline revision and observed module status, first verified implementation increments, API contract, test commands and encountered build issues. |
| November 23–24 | If performed, workspace configuration and live smoke results, model ID used, redacted responses, and resulting fixes or blockers. |
| November 25–26 | If performed, teammate integration feedback, review findings, and regression results against the current branch. |
| November 27–28 | Final tested revision, known limitations, remaining work, and approved issue/PR references if available. |

For **Code Standards and Sprint Plan**, use the conventions in sections A and B and the proposed issue breakdown. For the **four Sprint Essays**, use the corresponding window and actual evidence. For the **Testing Essay**, use the scenarios, environment, and results in section D. For the **Sprint Summary Essay**, distinguish completed Alpha scope from live and cross-module work. For the **classroom defense**, demo the sidebar route, one itinerary and a follow-up chat, then show the server-side request flow, tests, and remaining integration dependency.

## G. Next three actions

1. Supply the backend with an authorized Model Studio key, endpoint and model. Run a small itinerary and two-turn chat with test data, confirm browser rendering and record the live result with credentials redacted.
2. Rerun builds and regressions on the revision intended for team review. Link actual issue and PR references after remote authorization, and collect evidence in the current sprint windows.
3. Confirm the Trip and destination owners' contracts for explicit draft import, canonical place matching and map display before planning cross-module writes.
