# API Contract

Base URL: /api/v1

Successful responses use { "code": 0, "message": "success", "data": ... }.
Errors use a non-zero HTTP status and { "code": status, "message": "...", "data": null }.
Authenticated requests send Authorization: Bearer <token>.

## Authentication

### POST /auth/register

Request:

    { "username": "noah", "email": "noah@example.com", "password": "at-least-8-chars" }

Creates the account and returns the same shape as login, including a JWT and safe user profile.
Usernames and emails are unique; passwords are BCrypt-hashed and never returned.

### POST /auth/login

Request:

    { "email": "noah@example.com", "password": "at-least-8-chars" }

### GET /auth/me

Requires a bearer token. Returns the current user's safe profile.

Auth response data:

    {
      "token": "jwt",
      "user": {
        "id": 1,
        "username": "noah",
        "email": "noah@example.com",
        "nickname": "noah",
        "avatarUrl": null,
        "bio": null,
        "language": "zh"
      }
    }

## User Profile

### PUT /users/me

Requires a bearer token.

    {
      "nickname": "Noah",
      "avatarUrl": "",
      "bio": "Travel enthusiast",
      "language": "zh"
    }

### GET /users/search?q=<username>

Requires a bearer token. Search starts at two characters, excludes the current user, and returns up to ten summaries. Search results do not expose email addresses.

### POST /users/me/avatar

Requires a bearer token and a multipart form with a `file` field. Accepts PNG and JPEG up to 5 MB and returns the updated user profile in the standard response envelope.

### GET /users/{id}

Requires a bearer token. Returns the user's public profile, published trips, and buddy posts. Email and account settings are not exposed.

### GET /trips/mine and POST /trips

Requires a bearer token. Lists trips owned by the user or shared with them. Creating a trip accepts `title`, `destination`, and optional `startDate` / `endDate` ISO dates. New trips are private.

### PUT /trips/{id}/publish and DELETE /trips/{id}/publish

The owner can publish a trip or make it private again.

### GET /trips/{id}/members, POST /trips/{id}/members, DELETE /trips/members/{memberId}

The owner can list, add, and remove trip members. Adding a member accepts `{ "username": "..." }`; matching is case-insensitive and a user cannot be added twice or add themselves.

### GET /trips/favorites, POST /trips/{id}/favorite, DELETE /trips/{id}/favorite

Manage the signed-in user's saved public trips.

### GET /buddy/mine, POST /buddy, DELETE /buddy/{id}

Manage the signed-in user's buddy posts. Creating a post accepts `title`, `destination`, optional `travelDate`, and `description`.

## AI travel assistant

### POST /ai/generate-itinerary and POST /ai/chat

Both endpoints require a bearer token. The [AI assistant API guide](AI_ASSISTANT.md#api-contracts) covers inputs, example responses, validation, and failure statuses.

## Trip Expenses

Base path: `/api/v1`. Both endpoints require `Authorization: Bearer <token>`.
Only the trip owner and trip members can access its expenses.
`tripId` is the ID of the trip.

### POST /trips/{tripId}/expenses

Creates an expense. Example request body:

```json
{"title":"Test lunch","amount_cents":2850,"category":"food","date":"2026-11-23"}
```

`amount_cents` is an integer from `1` to `2147483647`, in cents. For example,
CNY 28.50 is sent as `2850`. Use `YYYY-MM-DD` for `date`. `note` is optional.
Allowed categories are `transport`, `lodging`, `food`, `ticket`, `shopping`,
and `other`.

Example response (HTTP 200):

```json
{"code":0,"message":"success","data":{"id":1,"title":"Test lunch","category":"food","date":"2026-11-23","amount_cents":2850}}
```

### GET /trips/{tripId}/expenses

Returns the trip's expenses. Example request: `GET /api/v1/trips/1/expenses`.
No request body is required. An empty list is returned as `data: []`.

Example response (HTTP 200):

```json
{"code":0,"message":"success","data":[{"id":1,"title":"Test lunch","category":"food","date":"2026-11-23","amount_cents":2850}]}
```

### Error responses

| HTTP status | Scenario |
| --- | --- |
| 400 | `amount_cents` is missing, is not an integer, is zero or negative, or exceeds `2147483647`. |
| 401 | The request does not include a valid login token. |
| 404 | The trip does not exist or the signed-in user is neither its owner nor a member. |
