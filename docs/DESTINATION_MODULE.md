# Destination module (Team C)

Team C had one job this round: reuse the existing page shell and design tokens, get the destination pages running, and leave usable run screenshots behind. Maps, itinerary scheduling and the weather API are scheduled later and are out of scope here.

## Pages and entry points

| Route | Purpose | Login required |
| --- | --- | --- |
| `/destinations` | Destination list: keyword search, category filter, heat/name sorting, empty state | No |
| `/destinations/:id` | Destination detail: facts, why-go reasons, same-category suggestions | No |

Three entry points: the "Destinations" link in the top bar, "Explore / Destinations" in the left rail after login, and "Plan a trip with this place" at the bottom of the detail page (routes to the login page when signed out). Destinations are public content, so neither page is wrapped in `ProtectedRoute`; it opens directly for demos and the defence session.

## Data source

- `frontend/src/data/destinations.ts`: 8 Fuzhou place samples (Sanfang Qixiang, Yantai Hill, Gushan, Pingtan Island, Shangxiahang, West Lake Park, Fudao Trail, Mawei Shipyard Heritage). Fields: bilingual name, category, district, address, summary, highlights, tags, ticket, suggested duration, opening hours, best season, coordinates and heat.
- `frontend/src/api/destinations.ts`: calls `GET /api/v1/destinations` first; when the API is unavailable or returns an empty array it falls back to the samples and passes `source` and `reason` to the page.

The page header labels the current data source: "Places API" when the call succeeds, "Local sample data" plus the reason when it falls back. **What we deliberately do not do**: invent trip records, ratings or favourite counts when the API is down, and never present an empty response as a normal result.

Once the places endpoints return `{ code: 0, data }` (`GET /destinations`, `GET /destinations/{id}`), only the implementation of `api/destinations.ts` changes; pages and styles stay untouched.

## File layout

- `frontend/src/data/destinations.ts`: sample data and types.
- `frontend/src/api/destinations.ts`: data adapter (API first, samples as fallback).
- `frontend/src/pages/DestinationsPage.tsx`: list page.
- `frontend/src/pages/DestinationDetailPage.tsx`: detail page.
- `frontend/src/components/DestinationCard.tsx`: card component shared by the list and "same category" suggestions.
- `frontend/src/destination.css`: module styles; every colour comes from the semantic variables in `themes.css`, so light and dark themes both work.
- `frontend/src/destination-translations.ts`: English and Chinese copy under the `dest` i18n namespace, avoiding the `destination` field already used by the trip form.

## Run and verify

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173/destinations in a browser. Vite binds `::1` on this machine, so `127.0.0.1` may refuse the connection; the regression script defaults to `localhost` for the same reason.

Production build: `npm run build` (passed this round, 430 kB JS / 54 kB CSS).

Browser regression: `frontend/scripts/verify-destination.cjs`, driven by Playwright against the installed Edge:

```powershell
$env:PLAYWRIGHT_MODULE = 'path to an installed playwright-core'
node scripts/verify-destination.cjs
```

The script checks, in order: 8 samples rendered, search for "Gushan" narrowing to 1 result, heritage category holding 4 entries, the empty state, 6 facts plus 3 highlights on the detail page, dark theme, the English UI, and a 390px mobile viewport with no horizontal overflow, then asserts there are no uncaught errors. Screenshots are written to `artifacts/destination/` (already git-ignored).

Result on 2026-11-23 (baseline `main` @ `a7d70ff`): every assertion passed, 6 screenshots in `artifacts/destination/`. Three of them are committed as evidence under `test/record1/destination/`, following the `序号-页面-日期-版本` naming convention. With the backend down or the endpoint missing, `/api/v1/destinations` returns 404/500 and the page falls back to the samples with the expected notice, which is the designed degradation path.

## Not wired yet

- Places API (`GET /destinations`, `GET /destinations/{id}`): swap the data source once the API fields are aligned with the sample structure.
- Weather, map pins and "add to trip": wait for the Team B trip API and the Team E favourite/permission APIs, so we do not ship buttons that cannot save anything.
- Images: covers use a category gradient plus a glyph today, with no external image requests; they can be replaced with team-owned photos later.
