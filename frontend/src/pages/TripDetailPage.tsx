import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarBlank,
  MapPin,
  MapTrifold,
  Receipt,
  Users,
} from "@phosphor-icons/react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { socialApi } from "../api/social";
import { UserAvatar } from "../components/UserAvatar";
import { useAuthStore } from "../store/authStore";
import type { Trip, TripMember } from "../types";
import TripExpensePanel from "./TripExpensePanel";
import "../trips.css";

type DetailState =
  | { status: "loading" | "unavailable" | "error" }
  | { status: "ready"; trip: Trip; members: TripMember[] };

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = useAuthStore((state) => state.user?.id);
  const tripId = Number(id);
  const validId =
    /^\d+$/.test(id ?? "") && Number.isSafeInteger(tripId) && tripId > 0;

  return (
    <TripDetail key={`${userId}-${id}`} tripId={validId ? tripId : null} />
  );
}

function TripDetail({ tripId }: { tripId: number | null }) {
  const { t } = useTranslation();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<DetailState>({
    status: tripId === null ? "unavailable" : "loading",
  });

  useEffect(() => {
    if (tripId === null) return;
    let active = true;
    setState({ status: "loading" });
    // Read by URL ID, not navigation state, so deep links and reloads work.
    void Promise.all([
      socialApi.tripDetail(tripId),
      socialApi.tripMembers(tripId),
    ])
      .then(([trip, members]) => {
        if (active) setState({ status: "ready", trip, members });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        const status = (reason as { status?: number } | null)?.status;
        setState({
          status: status === 404 || status === 403 ? "unavailable" : "error",
        });
      });
    return () => {
      active = false;
    };
  }, [tripId, attempt]);

  const backLink = (
    <Link className="trip-back-link" to="/trips">
      <ArrowLeft size={17} aria-hidden="true" /> {t("backToTrips")}
    </Link>
  );

  if (state.status !== "ready") {
    return (
      <main className="page-shell trip-page trip-detail-page">
        {backLink}
        <header className="trip-page-heading">
          <h1>{t("tripDetail")}</h1>
        </header>
        {state.status === "loading" ? (
          <p className="trip-state" role="status">
            {t("tripDetailLoading")}
          </p>
        ) : (
          <section className="trip-detail-notice" role="alert">
            {state.status === "unavailable" ? (
              <>
                <h2>{t("tripUnavailable")}</h2>
                <p>{t("tripUnavailableHint")}</p>
              </>
            ) : (
              <>
                <h2>{t("tripDetailLoadFailed")}</h2>
                <button
                  className="button button-secondary"
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  {t("retry")}
                </button>
              </>
            )}
          </section>
        )}
      </main>
    );
  }

  const { trip, members } = state;
  const dates = [trip.startDate, trip.endDate].filter(Boolean).join(" – ");

  return (
    <main className="page-shell trip-page trip-detail-page">
      {backLink}
      <header className="trip-detail-hero">
        <div className="trip-detail-heading">
          <div>
            <p className="trip-eyebrow">
              {t("tripDetail")} · ID {trip.id}
            </p>
            <h1>{trip.title}</h1>
          </div>
          <span className="trip-visibility">
            {t(trip.isPublic ? "publicTrip" : "privateTrip")}
          </span>
        </div>
        <dl className="trip-detail-facts">
          <div>
            <dt>
              <MapPin size={19} aria-hidden="true" />
              {t("destination")}
            </dt>
            <dd>{trip.destination}</dd>
          </div>
          <div>
            <dt>
              <CalendarBlank size={19} aria-hidden="true" />
              {t("tripDates")}
            </dt>
            <dd>{dates || t("dateNotSet")}</dd>
          </div>
          <div>
            <dt>
              <Users size={19} aria-hidden="true" />
              {t("tripMembers")}
            </dt>
            <dd>{members.length}</dd>
          </div>
        </dl>
      </header>

      <div className="trip-detail-grid">
        <section
          className="trip-detail-card"
          aria-labelledby="trip-places-heading"
        >
          <h2 id="trip-places-heading">
            <MapTrifold size={22} aria-hidden="true" />
            {t("tripPlaces")}
          </h2>
          <div className="trip-places-placeholder">
            <MapPin size={32} weight="duotone" aria-hidden="true" />
            <p>{t("tripPlacesPlaceholder")}</p>
          </div>
        </section>
        <section
          className="trip-detail-card"
          aria-labelledby="trip-expenses-heading"
        >
          <h2 id="trip-expenses-heading">
            <Receipt size={22} aria-hidden="true" />
            {t("tripExpensesSection")}
          </h2>
          <p>{t("tripExpensesHint")}</p>
          <TripExpensePanel tripId={trip.id} title={trip.title} />
        </section>
        <section
          className="trip-detail-card trip-detail-members"
          aria-labelledby="trip-members-heading"
        >
          <h2 id="trip-members-heading">
            <Users size={22} aria-hidden="true" />
            {t("tripMembers")} · {members.length}
          </h2>
          <ul className="trip-detail-member-list">
            {members.map((member) => (
              <li key={member.userId}>
                <UserAvatar
                  name={member.nickname || member.username}
                  src={member.avatarUrl}
                  size="small"
                />
                <div>
                  <strong>{member.nickname || member.username}</strong>
                  <small>@{member.username}</small>
                </div>
                <span className="trip-visibility">{t(member.role)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
