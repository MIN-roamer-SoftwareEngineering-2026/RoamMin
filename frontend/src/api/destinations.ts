// Destination data adapter (Team C).
// The places API owned by the Team C interface lead is not delivered yet, so we call /destinations first.
// When the API is unavailable we degrade to the local samples and hand the failure reason to the page,
// so empty data is never presented as a normal result.

import { http, unwrap } from "./http";
import {
  CATEGORY_ORDER,
  DESTINATION_SAMPLES,
  type Destination,
} from "../data/destinations";

export type DestinationSource = "api" | "sample";
export type SampleReason = "offline" | "empty";

export interface DestinationList {
  items: Destination[];
  source: DestinationSource;
  reason?: SampleReason;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isLocalized(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.zh === "string" &&
    typeof value.en === "string"
  );
}

function isDestination(value: unknown): value is Destination {
  if (!isRecord(value)) return false;

  const { id, category, tags, highlights, coords, heat } = value;
  const localizedFields = [
    "name",
    "district",
    "address",
    "summary",
    "ticket",
    "duration",
    "hours",
    "bestSeason",
  ];
  return (
    typeof id === "string" &&
    id.length > 0 &&
    CATEGORY_ORDER.some((key) => key === category) &&
    localizedFields.every((key) => isLocalized(value[key])) &&
    Array.isArray(tags) &&
    tags.every(isLocalized) &&
    Array.isArray(highlights) &&
    highlights.every(isLocalized) &&
    isRecord(coords) &&
    Number.isFinite(coords.lat) &&
    Number.isFinite(coords.lng) &&
    Number.isFinite(heat)
  );
}

export async function listDestinations(): Promise<DestinationList> {
  try {
    const items = await unwrap<unknown>(http.get("/destinations"));
    if (
      Array.isArray(items) &&
      items.length > 0 &&
      items.every(isDestination)
    ) {
      return { items, source: "api" };
    }
    return { items: DESTINATION_SAMPLES, source: "sample", reason: "empty" };
  } catch {
    // Backend not running, or the places endpoint not registered yet: both land here and report "api unavailable".
    return { items: DESTINATION_SAMPLES, source: "sample", reason: "offline" };
  }
}

export async function getDestination(id: string): Promise<Destination | null> {
  try {
    const destination = await unwrap<unknown>(http.get(`/destinations/${id}`));
    if (isDestination(destination) && destination.id === id) return destination;
  } catch {
    // The API is unavailable. Use the same fallback as an incomplete response.
  }
  return DESTINATION_SAMPLES.find((item) => item.id === id) ?? null;
}
