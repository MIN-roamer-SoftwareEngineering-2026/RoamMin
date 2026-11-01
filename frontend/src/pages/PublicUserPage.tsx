import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { socialApi } from "../api/social";
import { UserAvatar } from "../components/UserAvatar";
import type { PublicProfile } from "../types";

export function PublicUserPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<number[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!id) return;
    let active = true;
    setProfile(null);
    setError("");
    setSaved([]);
    if (!/^\d+$/.test(id)) {
      setError(t("loadFailed"));
      return;
    }
    void Promise.all([
      socialApi.publicProfile(Number(id)),
      socialApi.favorites(),
    ])
      .then(([person, favorites]) => {
        if (active) {
          setProfile(person);
          setSaved(favorites.map((trip) => trip.id));
        }
      })
      .catch((reason: unknown) => {
        if (active)
          setError(reason instanceof Error ? reason.message : t("loadFailed"));
      });
    return () => {
      active = false;
    };
  }, [id, t, attempt]);
  async function favorite(tripId: number) {
    if (busy) return;
    setBusy(true);
    try {
      await socialApi.favorite(tripId, !saved.includes(tripId));
      setSaved((ids) =>
        ids.includes(tripId)
          ? ids.filter((value) => value !== tripId)
          : [...ids, tripId],
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("saveFailed"));
    } finally {
      setBusy(false);
    }
  }
  if (error)
    return (
      <main className="page-shell profile-page">
        <p className="form-error" role="alert">
          {error}
        </p>
        <button
          className="button button-secondary"
          onClick={() => setAttempt((v) => v + 1)}
        >
          {t("retry")}
        </button>
        <Link className="text-link" to="/my">
          {t("myHome")}
        </Link>
      </main>
    );
  if (!profile)
    return (
      <main className="page-shell profile-page">
        <p className="status-line">{t("loading")}</p>
      </main>
    );
  return (
    <main className="page-shell public-user-page">
      <header className="public-user-heading">
        <UserAvatar
          name={profile.nickname || profile.username}
          src={profile.avatarUrl}
        />
        <div>
          <p className="eyebrow">{t("travelerProfile")}</p>
          <h1>{profile.nickname || profile.username}</h1>
          <p>@{profile.username}</p>
        </div>
      </header>
      <p className="public-user-bio">{profile.bio || t("bioEmpty")}</p>
      <section className="public-profile-section">
        <h2>
          {t("publishedTrips")} <span>{profile.publishedTrips.length}</span>
        </h2>
        {profile.publishedTrips.length ? (
          <div className="social-list">
            {profile.publishedTrips.map((trip) => (
              <article className="social-item" key={trip.id}>
                <div className="social-item-heading">
                  <div>
                    <h3>{trip.title}</h3>
                    <p>
                      {trip.destination} · {trip.startDate || t("dateNotSet")}
                    </p>
                  </div>
                  <button
                    className="button button-secondary"
                    onClick={() => void favorite(trip.id)}
                  >
                    {saved.includes(trip.id)
                      ? t("removeFavorite")
                      : t("addFavorite")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">{t("emptyPublicTrips")}</p>
        )}
      </section>
      <section className="public-profile-section">
        <h2>
          {t("buddyPosts")} <span>{profile.buddyPosts.length}</span>
        </h2>
        {profile.buddyPosts.length ? (
          <div className="social-list">
            {profile.buddyPosts.map((post) => (
              <article className="social-item" key={post.id}>
                <div className="social-item-heading">
                  <div>
                    <h3>{post.title}</h3>
                    <p>
                      {post.destination} · {post.travelDate || t("dateNotSet")}
                    </p>
                  </div>
                </div>
                <p className="post-description">{post.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">{t("emptyBuddyPosts")}</p>
        )}
      </section>
    </main>
  );
}
