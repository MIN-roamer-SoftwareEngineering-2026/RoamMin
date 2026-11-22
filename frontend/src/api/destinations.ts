// Destination data adapter (Team C).
// The places API owned by the Team C interface lead is not delivered yet, so we call /destinations first.
// When the API is unavailable we degrade to the local samples and hand the failure reason to the page,
// so empty data is never presented as a normal result.

import { http, unwrap } from "./http";
import { DESTINATION_SAMPLES, type Destination } from "../data/destinations";

export type DestinationSource = "api" | "sample";
export type SampleReason = "offline" | "empty";

export interface DestinationList {
  items: Destination[];
  source: DestinationSource;
  reason?: SampleReason;
}

export async function listDestinations(): Promise<DestinationList> {
  try {
    const items = await unwrap<Destination[]>(http.get("/destinations"));
    if (Array.isArray(items) && items.length > 0) {
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
    return await unwrap<Destination>(http.get(`/destinations/${id}`));
  } catch {
    return DESTINATION_SAMPLES.find((item) => item.id === id) ?? null;
  }
}
