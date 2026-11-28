// Distance helpers for the destination pages (Team C).
// Straight-line distance only: the sample records carry coordinates but no routing data,
// so the page must not imply a travel time or a suggested route.

import type { Destination } from "./destinations";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface NearbyDestination {
  item: Destination;
  km: number;
}

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const earthRadius = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(deltaLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

/** Two significant figures: 0.8 km, 3.2 km — enough for a "how far is it" glance. */
export function formatDistance(km: number): number {
  if (km < 1) return Math.max(0.1, Math.round(km * 10) / 10);
  if (km < 10) return Math.round(km * 10) / 10;
  return Math.round(km);
}

export function findNearby(
  current: Destination,
  all: Destination[],
  limit = 3,
): NearbyDestination[] {
  return all
    .filter((item) => item.id !== current.id)
    .map((item) => ({ item, km: distanceKm(current.coords, item.coords) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}
