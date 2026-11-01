# MIN-roamer

Travel planning and social platform. The project is split into a React frontend and a Spring Boot backend.

## Requirements

- Node.js 18 or later
- JDK 17 or later
- Maven 3.9 or later

## Frontend

From the frontend directory, run npm install and then npm run dev.

The Vite development server runs at http://localhost:5173. API requests use /api/v1; Vite proxies them to http://localhost:8080.

## Backend

Set a local Base64-encoded JWT signing secret before starting Spring Boot:

    $bytes = [System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)
    $env:JWT_SECRET = [Convert]::ToBase64String($bytes)
    cd backend
    mvn spring-boot:run

The API runs at http://localhost:8080/api/v1. H2 uses file mode and stores its database under backend/data/, which is ignored by Git.

## Current scope

- Authentication: register, login, current user, logout on the client
- User profile: edit nickname, avatar URL, bio, and language
- User search endpoint for trip-member invitations
- Frontend foundations: routing, API client, Zustand auth state, Chinese/English strings, Tailwind CSS

User pages now include a dark navy/orange traveler center, profile editing and avatar upload, personal content tabs, user search, and Chinese/English support. See [用户模块运行与说明](docs/USER_MODULE.md).

Map, itinerary scheduling, destination, budget, community square, and AI modules are reserved for their owning teams. The personal homepage reuses the existing trip, favorite, buddy-post and member APIs.
