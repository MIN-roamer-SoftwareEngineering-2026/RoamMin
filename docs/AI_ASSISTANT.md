# AI Travel Assistant

Sign in and select **AI Assistant** in the MIN-roamer navigation. Itinerary generation creates a reviewable daily draft. Travel chat keeps the conversation in page memory and sends the latest four completed exchanges with each follow-up. Switching between the two panels preserves their state. Clearing chat, leaving the route, refreshing, or signing out clears the chat. The backend processes each request independently and stores no AI drafts or messages in H2.

## Configure Qwen

Start the frontend and backend as described in the [project README](../README.md). Use [backend/.env.example](../backend/.env.example) as a list of settings to provide to the backend process. Spring Boot reads its process environment. For the Windows launcher, set the variables in its parent PowerShell session before running `scripts/Start-Local.ps1`.

| Variable | Value |
| --- | --- |
| `JWT_SECRET` | Existing application signing secret. |
| `DASHSCOPE_API_KEY` | Model Studio key from the selected workspace and region. Set through the backend environment or hosting secret store. |
| `QWEN_ENDPOINT` | Full HTTPS Chat Completions URL for that workspace, ending in `/compatible-mode/v1/chat/completions`. |
| `QWEN_MODEL` | Model ID available to the workspace. The example uses `qwen-plus`. Select a text model that supports JSON Object mode with thinking disabled. |
| `QWEN_TIMEOUT` | End-to-end provider deadline, default `45s`, supported range `1ms` to `60s`. |

Match the endpoint and key region. Check your workspace's model access and supported output modes. [Alibaba Cloud Chat Completions](https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope) · [Qwen structured output](https://www.alibabacloud.com/help/en/model-studio/qwen-structured-output) · [Qwen Plus workspace example](https://www.alibabacloud.com/help/en/model-studio/model-calling-in-sub-workspace)

Only the backend sends the provider credential. Keep it out of files tracked by Git and all `VITE_*` settings. The request sends the itinerary form details or travel conversation text to Model Studio. Omit sensitive information such as passport numbers and booking references. Basic app functionality can run with AI settings empty. The AI endpoints then return HTTP 503.

## API contracts

Both endpoints require an existing JWT in `Authorization: Bearer <token>`, consume `application/json`, and use the application's `ApiResponse<T>` envelope. The paths below are relative to `/api/v1`.

### POST /ai/generate-itinerary

```json
{
  "destination": "Fuzhou",
  "days": 1,
  "budget": 1500,
  "preferences": ["Historical attractions", "Local food"],
  "requirements": "Keep walking distances short",
  "language": "en"
}
```

The destination is required and limited to 80 characters. Days must be an integer from 1 through 14. Optional budget is in CNY, from 0 through 1,000,000 with at most two decimal places. Up to six preferences of 80 characters each and one requirements string of up to 600 characters are allowed. Optional `language` is `en` or `zh`. When omitted the prompt asks the model to infer the response language.

Illustrative success payload:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "destination": "Fuzhou",
    "days": 1,
    "dailyItinerary": [
      {
        "day": 1,
        "title": "Historic lanes",
        "activities": [
          {
            "name": "Sanfang Qixiang",
            "description": "Walk around the old quarter.",
            "estimatedCost": null
          }
        ]
      }
    ],
    "suggestions": ["Verify opening hours."]
  }
}
```

The backend supplies the destination and number of days from the request. It validates that days are consecutive and contain one to three activities, that names and descriptions are present and bounded, that optional costs are valid numbers, and that optional suggestions contain at most four bounded strings. A null estimated cost means the model omitted a usable estimate. Prices, access, hours, and routes should be verified before making travel decisions.

### POST /ai/chat

```json
{
  "message": "How do I get there from the railway station?",
  "history": [
    { "role": "user", "content": "Where should I go in Fuzhou?" },
    { "role": "assistant", "content": "Start in the old quarter." }
  ],
  "travelContext": "Arriving at Fuzhou Railway Station",
  "language": "en"
}
```

The message is required and limited to 1,200 characters. History is optional and contains up to eight nonblank messages ordered as complete user/assistant pairs. Each historical message is limited to 1,600 characters. Optional `travelContext` is limited to 600 characters. Optional `language` accepts `en` or `zh`. Success data contains a `reply` string rendered as plain text. Clients provide their own context, so historical assistant messages should be treated as user-supplied data.

### Failure handling and request limits

| Status | Meaning |
| --- | --- |
| 400 | Malformed JSON, invalid fields, or invalid history order. |
| 401 | Missing or invalid authentication. |
| 413 | Request exceeds 96 KiB. |
| 429 | Local AI rate/concurrency limit or upstream provider quota. |
| 502 | Provider error, incomplete completion, or invalid model output. |
| 503 | Missing or invalid backend provider configuration. |
| 504 | Provider timeout. |

The Java HTTP client enforces a five-second connection timeout and a configurable total deadline, and rejects redirects. Provider error bodies and credentials stay server-side and are omitted from client-facing errors. The frontend uses a 65-second timeout for these two calls. Retry is a user action after a failure, which makes a new request and uses quota.

For each backend process, both endpoints share fixed 60-second windows with up to six accepted calls per account and 30 calls total, and at most four simultaneous provider calls. A validated call admitted by the limiter counts even if its provider call fails. Counters live in memory, reset on process restart, and are independent per running backend instance. Window boundaries allow short bursts. Treat these limits as Alpha safeguards and use the provider's account controls for spending limits.

## Run checks

- Backend from `backend/`: `mvn clean package`. JUnit and MockMvc use test data and mocked provider calls.
- Frontend from `frontend/`: `npm ci`, `npm run build`, and `npm run lint`.
- Browser from `frontend/`: Start both servers with an isolated H2 database, such as `SPRING_DATASOURCE_URL=jdbc:h2:mem:aiqa;DB_CLOSE_DELAY=-1`, and use a dedicated `APP_AVATAR_DIRECTORY` if also running the user-module regression. Run `node --test scripts/verify-ai-assistant.cjs` with Playwright and Chromium available. The script registers a temporary account and intercepts AI requests. It accepts `PLAYWRIGHT_MODULE`, `QA_BROWSER`, `QA_BASE_URL`, and `QA_OUTPUT` using the same conventions as the [user-module browser regression](USER_MODULE.md#验证).
