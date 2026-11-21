## Summary

Adds the AI Travel Assistant for the EE308FZ Alpha Sprint. Signed-in travelers can generate a draft itinerary and ask follow-up travel questions. The existing trip list and trip records stay independent of AI results.

## Implemented features

- Day-by-day itineraries for 1–14 days, with optional CNY budget, preferences, and requirements.
- Travel chat with the last four exchanges included as context. Users can restart the conversation.
- English and Chinese, light and dark appearance, responsive layout, wait states, and user-initiated retries.

## Backend API changes

- `POST /api/v1/ai/generate-itinerary` and `POST /api/v1/ai/chat` use JWT and the existing response envelope.
- Scoped JSON validation rejects incorrect scalar types, duplicate keys, trailing JSON, and unsupported request formats before the provider call.
- A server-side HTTPS Qwen client validates the response, enforces connection and total deadlines, bounds the upstream body, and sanitizes provider errors.

## Frontend changes

Adds the protected `/ai` route and sidebar entry. Both panels use the existing HTTP client, auth store, translations and theme tokens. Browser and provider timeouts produce localized feedback.

## Security considerations

Provider credentials are read from the backend environment. Verification checked JWT expiry and authorization, the production bundle, provider-error redaction, and rate limits. Each running backend process permits six calls per account and 30 total per minute, with four in flight. The browser offers manual retry.

## Tests performed

- JUnit and MockMvc: 56 passed, 0 failed, 0 skipped.
- TypeScript, production frontend/backend builds, frontend lint, and both browser script syntax checks passed.
- AI Playwright regression: eight scenarios passed. The existing user-module regression also passed.
- Local HTTPS fixture: browser sign-in, three-day Fuzhou draft at CNY 1500, two chat turns with context, and an unchanged pre-existing saved trip. Verified 429/502/504 handling, including an oversized response and a body-read timeout.
- Missing credentials and invalid timeout configuration: the real application started, account operations worked, and both AI endpoints returned 503.

## Screenshots

Local Alpha evidence captured from the HTTPS fixture:

- `frontend/artifacts/ai-phase2/https/itinerary-light.png` — desktop itinerary, three days.
- `frontend/artifacts/ai-phase2/https/chat-dark-mobile.png` — contextual chat, dark theme, 320px viewport.

## Known limitations

Live Model Studio verification is pending an authorized workspace configuration. Drafts and chat history are page-scoped. Suggestions and estimates require traveler verification. Rate counters are per process.

## Integration notes

The feature uses the existing database schema. Draft import needs agreement on the Trip activity and permission contracts. Place matching and map display need canonical place data. See `docs/AI_ASSISTANT.md` for setup and fixtures and `docs/AI_PHASE2_REVIEW.md` for evidence and findings.
