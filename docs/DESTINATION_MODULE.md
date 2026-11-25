# Destination module (Team C)

Team C had one job this round: reuse the existing page shell and design tokens, get the destination pages running, and leave usable run screenshots behind. Maps, itinerary scheduling and the weather API are scheduled later and are out of scope here.

## Pages and entry points

| Route | Purpose | Login required |
| --- | --- | --- |
| `/destinations` | Destination list: keyword search, category filter, heat/name sorting, empty state | No |
| `/destinations/:id` | Destination detail: facts, why-go reasons, nearby-by-distance (2026-11-25), same-category suggestions, plan-a-trip hand-off | No |

Three entry points: the "Destinations" link in the top bar, "Explore / Destinations" in the left rail after login, and "Plan a trip with this place" at the bottom of the detail page. Signed-in visitors are sent to `/trips/new?from=<destination id>` so the trip form opens prefilled; signed-out visitors go to `/login` as before. Destinations are public content, so neither page is wrapped in `ProtectedRoute`; it opens directly for demos and the defence session.

## Nearby recommendations (2026-11-25)

`frontend/src/data/distance.ts` computes haversine distance between the sample coordinates. The detail page shows the three closest destinations with a `直线 X 公里` / `X km straight line` badge on the cover, sorted from close to far. The section states in copy that this is **straight-line distance only**: the samples carry no routing data, so no travel time and no "recommended order" is implied. Same-category suggestions stay as a separate section.

## One-click trip hand-off (2026-11-25)

The detail CTA links to `/trips/new?from=<destination id>`. `CreateTripPage` reads only that query parameter and prefills the trip name (`<place>周末行程` / `A weekend in <place>`) and the destination field, with a hint that shows where the values came from and a link back to the destination. Everything else in the form — validation, dates, submission — is untouched Team B logic, so the change is two additive blocks in their page rather than a rewrite. Verified end to end: prefilled form → created trip → the new trip appears in "my trips".

## Data source

- `frontend/src/data/destinations.ts`: 8 Fuzhou place samples (Sanfang Qixiang, Yantai Hill, Gushan, Pingtan Island, Shangxiahang, West Lake Park, Fudao Trail, Mawei Shipyard Heritage). Fields: bilingual name, category, district, address, summary, highlights, tags, ticket, suggested duration, opening hours, best season, coordinates and heat.
- `frontend/src/api/destinations.ts`: calls `GET /api/v1/destinations` first; when the API is unavailable or returns an empty array it falls back to the samples and passes `source` and `reason` to the page.

The page header labels the current data source: "Places API" when the call succeeds, "Local sample data" plus the reason when it falls back. **What we deliberately do not do**: invent trip records, ratings or favourite counts when the API is down, and never present an empty response as a normal result.

Once the places endpoints return `{ code: 0, data }` (`GET /destinations`, `GET /destinations/{id}`), only the implementation of `api/destinations.ts` changes; pages and styles stay untouched.

## File layout

- `frontend/src/data/destinations.ts`: sample data and types.
- `frontend/src/data/distance.ts`: haversine distance and the nearby picker used by the detail page.
- `frontend/src/api/destinations.ts`: data adapter (API first, samples as fallback).
- `frontend/src/pages/DestinationsPage.tsx`: list page.
- `frontend/src/pages/DestinationDetailPage.tsx`: detail page.
- `frontend/src/components/DestinationCard.tsx`: card component shared by the list, the nearby section and "same category" suggestions (optional `distanceLabel`).
- `frontend/src/destination.css`: module styles; every colour comes from the semantic variables in `themes.css`, so light and dark themes both work.
- `frontend/src/destination-translations.ts`: English and Chinese copy under the `dest` i18n namespace, avoiding the `destination` field already used by the trip form.
- `frontend/scripts/verify-destination.cjs`: browser regression for the destination pages.
- `frontend/scripts/verify-trip-link.cjs`: browser regression for the destination → create-trip hand-off (needs the backend on 8080).

## Run and verify

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173/destinations in a browser. Vite binds `::1` on this machine, so `127.0.0.1` may refuse the connection; the regression script defaults to `localhost` for the same reason.

Production build: `npm run build` (passed 2026-11-25 on `main` @ `bfd124d`: 4708 modules, 484.01 kB JS / 93.56 kB CSS).

Browser regression: `frontend/scripts/verify-destination.cjs`, driven by Playwright against the installed Edge:

```powershell
$env:PLAYWRIGHT_MODULE = 'path to an installed playwright-core'
node scripts/verify-destination.cjs
```

The script checks, in order: 8 samples rendered, search for "Gushan" narrowing to 1 result, heritage category holding 4 entries, the empty state, 6 facts plus 3 highlights on the detail page, three nearby cards each carrying a distance badge sorted close to far, the plan-a-trip button pointing at `/login` while signed out, dark theme, the English UI, and a 390px mobile viewport with no horizontal overflow, then asserts there are no uncaught errors. Screenshots are written to `artifacts/destination/` (already git-ignored).

The hand-off check is `frontend/scripts/verify-trip-link.cjs` (backend on 8080 required): it registers a throwaway account, asserts `/trips/new` stays empty without the query parameter, asserts `?from=sanfang-qixiang` prefills both fields plus the source hint and back link, then submits the form and expects the new trip in "my trips".

Result on 2026-11-25 (branch based on `main` @ `bfd124d`): both scripts green — 10 destination assertions, 3 hand-off assertions. Evidence lives in `test/record1/destination/`: `04-nearby-1125-bfd124d.png` and `05-trip-prefill-1125-bfd124d.png`. With the backend down or the endpoint missing, `/api/v1/destinations` returns 404/500 and the page falls back to the samples with the expected notice, which is the designed degradation path.

## Not wired yet

- Places API (`GET /destinations`, `GET /destinations/{id}`): swap the data source once the API fields are aligned with the sample structure.
- Weather and map pins: wait for the Team C interface work (#13) to finish, so we do not ship placeholders that look like real data.
- Distances are straight-line only; once a routing/map API is available, `data/distance.ts` is the single place to replace.
- Images: covers use a category gradient plus a glyph today, with no external image requests; they can be replaced with team-owned photos later.
