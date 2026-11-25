import { useCallback, useEffect, useState } from "react";
import { CalendarBlank, CaretRight, MapPin, Plus } from "@phosphor-icons/react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { socialApi } from "../api/social";
import { useAuthStore } from "../store/authStore";
import type { Trip } from "../types";
import "../trips.css";

export function MyTripsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [params] = useSearchParams();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTrips(
        (await socialApi.myTrips()).filter((trip) => trip.ownerId === user?.id),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t, user?.id]);
  useEffect(() => {
    void load();
  }, [load]);
  const createdId = params.get("created");
  return (
    <main className="page-shell trip-page">
      <header className="trip-page-heading">
        <div>
          <p className="trip-eyebrow">{t("personalSpace")}</p>
          <h1>{t("myTrips")}</h1>
        </div>
        <Link className="button button-primary" to="/trips/new">
          <Plus size={17} />
          {t("createTrip")}
        </Link>
      </header>
      {createdId && (
        <p className="trip-success" role="status">
          ID {createdId}
        </p>
      )}
      {error && (
        <p className="trip-form-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="trip-state">{t("loading")}</p>
      ) : trips.length === 0 ? (
        <section className="trip-empty-state">
          <h2>{t("emptyTrips")}</h2>
          <Link className="button button-primary" to="/trips/new">
            <Plus size={17} />
            {t("createTrip")}
          </Link>
        </section>
      ) : (
        <section className="trip-list" aria-label={t("myTrips")}>
          {trips.map((trip) => (
            <Link
              className="trip-list-item trip-list-link"
              key={trip.id}
              to={`/trips/${trip.id}`}
            >
              <div>
                <span className="trip-id">ID {trip.id}</span>
                <h2>{trip.title}</h2>
                <p>
                  <MapPin size={16} />
                  {trip.destination}
                </p>
                <p>
                  <CalendarBlank size={16} />
                  {formatDates(trip, t("dateNotSet"))}
                </p>
              </div>
              <div className="trip-list-actions">
                <span className="trip-visibility">
                  {t(trip.isPublic ? "publicTrip" : "privateTrip")}
                </span>
                <span className="trip-detail-link-label">
                  {t("viewTripDetail")}{" "}
                  <CaretRight size={16} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
function formatDates(trip: Trip, fallback: string) {
  return trip.startDate || trip.endDate
    ? [trip.startDate, trip.endDate].filter(Boolean).join(" - ")
    : fallback;
}
