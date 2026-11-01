import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/auth";
import { socialApi } from "../api/social";
import { UserAvatar } from "../components/UserAvatar";
import type { BuddyPost, Trip, TripMember, UserSummary } from "../types";
import { useAuthStore } from "../store/authStore";
import { UserSearch as SharedUserSearch } from "../components/UserSearch";
import { ConfirmDialog } from "../components/ConfirmDialog";
import {
  ArrowUpRight,
  BookmarkSimple,
  Compass,
  MapTrifold,
  PencilSimple,
  Users,
  MagnifyingGlass,
  Plus,
  PaperPlaneTilt,
  GlobeHemisphereWest,
} from "@phosphor-icons/react";

type Tab = "trips" | "favorites" | "buddies" | "joined";

export function MyHomePage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<Tab>("trips");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [favorites, setFavorites] = useState<Trip[]>([]);
  const [posts, setPosts] = useState<BuddyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tripForm, setTripForm] = useState({
    title: "",
    destination: "",
    startDate: "",
    endDate: "",
  });
  const [buddyForm, setBuddyForm] = useState({
    title: "",
    destination: "",
    travelDate: "",
    description: "",
  });
  const [inviteTrip, setInviteTrip] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [myTrips, myFavorites, myPosts] = await Promise.all([
        socialApi.myTrips(),
        socialApi.favorites(),
        socialApi.buddyPosts(),
      ]);
      setTrips(myTrips);
      setFavorites(myFavorites);
      setPosts(myPosts);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await socialApi.createTrip({
        ...tripForm,
        startDate: tripForm.startDate || null,
        endDate: tripForm.endDate || null,
      });
      setTripForm({ title: "", destination: "", startDate: "", endDate: "" });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await socialApi.createBuddyPost({
        ...buddyForm,
        travelDate: buddyForm.travelDate || null,
      });
      setBuddyForm({
        title: "",
        destination: "",
        travelDate: "",
        description: "",
      });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function publish(trip: Trip) {
    setError("");
    try {
      await socialApi.publishTrip(trip.id, !trip.isPublic);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("saveFailed"));
    }
  }

  async function removeFavorite(tripId: number) {
    try {
      await socialApi.favorite(tripId, false);
      setFavorites((items) => items.filter((item) => item.id !== tripId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("saveFailed"));
    }
  }

  async function removePost(postId: number) {
    try {
      await socialApi.deleteBuddyPost(postId);
      setPosts((items) => items.filter((post) => post.id !== postId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("saveFailed"));
    }
  }

  if (!user) return null;
  const owned = trips.filter((trip) => trip.ownerId === user.id);
  const joined = trips.filter((trip) => trip.ownerId !== user.id);
  const matching = (item: { title: string; destination: string }) =>
    `${item.title} ${item.destination}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase());
  const displayedTrips = (tab === "joined" ? joined : owned).filter(matching);
  const count =
    tab === "trips"
      ? owned.length
      : tab === "joined"
        ? joined.length
        : tab === "favorites"
          ? favorites.length
          : posts.length;
  const progress = 50 + (user.avatarUrl ? 25 : 0) + (user.bio?.trim() ? 25 : 0);

  return (
    <main className="page-shell my-home-page">
      <div className="space-cover">
        <div>
          <p className="eyebrow">{t("coverKicker")}</p>
          <h2>{t("coverTitle")}</h2>
          <p>{t("coverCaption")}</p>
        </div>
        <span className="cover-coordinate">
          <Compass size={19} /> A LITTLE FURTHER, A LITTLE FREER.
        </span>
      </div>
      <header className="my-home-heading">
        <div className="my-home-identity">
          <UserAvatar
            name={user.nickname || user.username}
            src={user.avatarUrl}
          />
          <div>
            <p className="eyebrow">{t("personalSpace")}</p>
            <h1>
              {user.nickname || user.username}
              <span className="traveler-pill">MIN TRAVELER</span>
            </h1>
            <p>@{user.username}</p>
          </div>
        </div>
        <Link className="button button-secondary" to="/profile">
          <PencilSimple size={17} />
          {t("editProfile")}
        </Link>
      </header>
      <section className="space-stats" aria-label={t("accountOverview")}>
        {[
          {
            key: "trips",
            label: "ownedTrips",
            hint: "tripsCaption",
            value: owned.length,
            Icon: MapTrifold,
          },
          {
            key: "favorites",
            label: "myFavorites",
            hint: "favoritesCaption",
            value: favorites.length,
            Icon: BookmarkSimple,
          },
          {
            key: "buddies",
            label: "myBuddyPosts",
            hint: "buddyPosts",
            value: posts.length,
            Icon: PaperPlaneTilt,
          },
          {
            key: "joined",
            label: "joinedTrips",
            hint: "joinedCaption",
            value: joined.length,
            Icon: Users,
          },
        ].map(({ key, label, hint, value, Icon }) => (
          <button
            key={key}
            onClick={() => {
              setTab(key as Tab);
              setSearch("");
            }}
          >
            <span className={`stat-icon stat-${key}`}>
              <Icon size={23} weight="duotone" />
            </span>
            <span>
              <span className="stat-label">{t(label)}</span>
              <strong>
                {loading || error ? "—" : value.toString().padStart(2, "0")}
              </strong>
              <small>{t(hint)}</small>
            </span>
            <ArrowUpRight className="stat-arrow" size={16} />
          </button>
        ))}
      </section>
      <div className="my-home-layout">
        <section className="my-home-main">
          <div
            className="home-tabs"
            role="tablist"
            aria-label={t("personalSpace")}
          >
            {(["trips", "favorites", "buddies", "joined"] as const).map(
              (item) => (
                <button
                  key={item}
                  id={`tab-${item}`}
                  aria-controls="personal-content"
                  role="tab"
                  aria-selected={tab === item}
                  onClick={() => {
                    setTab(item);
                    setSearch("");
                  }}
                >
                  {t(
                    item === "trips"
                      ? "myTrips"
                      : item === "favorites"
                        ? "myFavorites"
                        : item === "joined"
                          ? "joinedTrips"
                          : "myBuddyPosts",
                  )}
                  <span>
                    {loading || error
                      ? "—"
                      : item === "trips"
                        ? owned.length
                        : item === "joined"
                          ? joined.length
                          : item === "favorites"
                            ? favorites.length
                            : posts.length}
                  </span>
                </button>
              ),
            )}
          </div>
          {error && (
            <div className="load-error" role="alert">
              <strong>{t("loadErrorTitle")}</strong>
              <p>{error}</p>
              <button
                className="button button-secondary"
                onClick={() => void load()}
              >
                {t("retry")}
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading-state" role="status">
              <span className="loading-spinner" />
              {t("loadingContent")}
            </div>
          ) : (
            !error && (
              <div
                className="home-content"
                id="personal-content"
                role="tabpanel"
                aria-labelledby={`tab-${tab}`}
              >
                <div className="content-toolbar">
                  <h2>
                    {t(
                      tab === "trips"
                        ? "myTrips"
                        : tab === "joined"
                          ? "joinedTrips"
                          : tab === "favorites"
                            ? "myFavorites"
                            : "myBuddyPosts",
                    )}
                    <span>{count}</span>
                  </h2>
                  <div className="search-field">
                    <MagnifyingGlass size={17} />
                    <input
                      aria-label={t("searchContent")}
                      placeholder={t("searchContent")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                {(tab === "trips" || tab === "joined") && (
                  <>
                    {tab === "trips" && (
                      <details className="create-disclosure">
                        <summary>
                          <Plus size={16} />
                          {t("createTrip")}
                        </summary>
                        <form
                          className="compact-create-form"
                          onSubmit={createTrip}
                        >
                          <h2>{t("createTrip")}</h2>
                          <div className="form-row">
                            <input
                              required
                              maxLength={80}
                              placeholder={t("tripName")}
                              value={tripForm.title}
                              onChange={(e) =>
                                setTripForm({
                                  ...tripForm,
                                  title: e.target.value,
                                })
                              }
                            />
                            <input
                              required
                              maxLength={80}
                              placeholder={t("destination")}
                              value={tripForm.destination}
                              onChange={(e) =>
                                setTripForm({
                                  ...tripForm,
                                  destination: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-row date-row">
                            <label>
                              {t("startDate")}
                              <input
                                type="date"
                                value={tripForm.startDate}
                                onChange={(e) =>
                                  setTripForm({
                                    ...tripForm,
                                    startDate: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <label>
                              {t("endDate")}
                              <input
                                type="date"
                                min={tripForm.startDate || undefined}
                                value={tripForm.endDate}
                                onChange={(e) =>
                                  setTripForm({
                                    ...tripForm,
                                    endDate: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <button
                              className="button button-primary"
                              disabled={busy}
                            >
                              {busy ? t("saving") : t("create")}
                            </button>
                          </div>
                        </form>
                      </details>
                    )}
                    {displayedTrips.length ? (
                      <div className="social-list trip-card-grid">
                        {displayedTrips.map((trip) => (
                          <article className="social-item" key={trip.id}>
                            <div className="trip-card-image">
                              <MapTrifold size={24} />
                              <span>{trip.destination}</span>
                            </div>
                            <div className="social-item-heading">
                              <div>
                                <h3>{trip.title}</h3>
                                <p>
                                  {trip.destination} ·{" "}
                                  {trip.startDate || t("dateNotSet")}
                                  {trip.endDate ? ` – ${trip.endDate}` : ""}
                                </p>
                              </div>
                              <span
                                className={`visibility-label ${trip.isPublic ? "is-public" : ""}`}
                              >
                                {trip.isPublic
                                  ? t("publicTrip")
                                  : t("privateTrip")}
                              </span>
                            </div>
                            <div className="social-item-actions">
                              {trip.ownerId === user.id && (
                                <button
                                  className="button button-secondary"
                                  onClick={() => void publish(trip)}
                                >
                                  {trip.isPublic
                                    ? t("unpublish")
                                    : t("publish")}
                                </button>
                              )}
                              {trip.ownerId === user.id && (
                                <button
                                  className="button button-secondary"
                                  onClick={() =>
                                    setInviteTrip(
                                      inviteTrip === trip.id ? null : trip.id,
                                    )
                                  }
                                >
                                  {t("manageMembers")}
                                </button>
                              )}
                            </div>
                            {inviteTrip === trip.id && (
                              <InvitePanel
                                trip={trip}
                                onChange={load}
                                onError={setError}
                              />
                            )}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <span className="empty-icon">
                          <MapTrifold size={42} weight="duotone" />
                        </span>
                        <h3>
                          {search
                            ? t("noMatch")
                            : t(
                                tab === "joined"
                                  ? "emptyJoinedTitle"
                                  : "emptyTitle",
                              )}
                        </h3>
                        <p>
                          {t(tab === "joined" ? "emptyJoined" : "emptyTrips")}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {tab === "favorites" &&
                  (favorites.filter(matching).length ? (
                    <div className="social-list trip-card-grid">
                      {favorites.filter(matching).map((trip) => (
                        <article className="social-item" key={trip.id}>
                          <div className="trip-card-image">
                            <BookmarkSimple size={24} />
                            <span>{trip.destination}</span>
                          </div>
                          <div className="social-item-heading">
                            <div>
                              <h3>{trip.title}</h3>
                              <p>
                                {trip.destination} ·{" "}
                                {trip.startDate || t("dateNotSet")}
                              </p>
                            </div>
                            <Link
                              className="text-link"
                              to={`/users/${trip.ownerId}`}
                            >
                              {t("viewAuthor")}
                            </Link>
                          </div>
                          <button
                            className="button button-secondary"
                            onClick={() => void removeFavorite(trip.id)}
                          >
                            {t("removeFavorite")}
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <span className="empty-icon">
                        <BookmarkSimple size={42} weight="duotone" />
                      </span>
                      <h3>{t(search ? "noMatch" : "emptyFavoriteTitle")}</h3>
                      <p>{t("emptyFavorites")}</p>
                    </div>
                  ))}
                {tab === "buddies" && (
                  <>
                    <details className="create-disclosure">
                      <summary>
                        <Plus size={16} />
                        {t("publishBuddyPost")}
                      </summary>
                      <form
                        className="compact-create-form"
                        onSubmit={createPost}
                      >
                        <h2>{t("publishBuddyPost")}</h2>
                        <div className="form-row">
                          <input
                            required
                            maxLength={80}
                            placeholder={t("postTitle")}
                            value={buddyForm.title}
                            onChange={(e) =>
                              setBuddyForm({
                                ...buddyForm,
                                title: e.target.value,
                              })
                            }
                          />
                          <input
                            required
                            maxLength={80}
                            placeholder={t("destination")}
                            value={buddyForm.destination}
                            onChange={(e) =>
                              setBuddyForm({
                                ...buddyForm,
                                destination: e.target.value,
                              })
                            }
                          />
                          <input
                            type="date"
                            aria-label={t("travelDate")}
                            value={buddyForm.travelDate}
                            onChange={(e) =>
                              setBuddyForm({
                                ...buddyForm,
                                travelDate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="form-row">
                          <textarea
                            required
                            maxLength={1000}
                            rows={3}
                            placeholder={t("buddyDescription")}
                            value={buddyForm.description}
                            onChange={(e) =>
                              setBuddyForm({
                                ...buddyForm,
                                description: e.target.value,
                              })
                            }
                          />
                          <button
                            className="button button-primary"
                            disabled={busy}
                          >
                            {busy ? t("saving") : t("publish")}
                          </button>
                        </div>
                      </form>
                    </details>
                    {posts.filter(matching).length ? (
                      <div className="social-list">
                        {posts.filter(matching).map((post) => (
                          <article className="social-item" key={post.id}>
                            <div className="social-item-heading">
                              <div>
                                <h3>{post.title}</h3>
                                <p>
                                  {post.destination} ·{" "}
                                  {post.travelDate || t("dateNotSet")}
                                </p>
                              </div>
                              <button
                                className="button button-secondary"
                                onClick={() => setDeleteId(post.id)}
                              >
                                {t("delete")}
                              </button>
                            </div>
                            <p className="post-description">
                              {post.description}
                            </p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <span className="empty-icon">
                          <Users size={42} weight="duotone" />
                        </span>
                        <h3>{t(search ? "noMatch" : "emptyBuddyTitle")}</h3>
                        <p>{t("emptyBuddyPosts")}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          )}
        </section>
        <aside className="my-home-aside">
          <p className="eyebrow">{t("aboutMe")}</p>
          <p className="about-bio">{user.bio || t("bioEmpty")}</p>
          <div className="profile-detail">
            <GlobeHemisphereWest size={17} />
            {user.language === "en" ? "English" : "中文"}
          </div>
          <div className="completion-card">
            <div>
              <strong>{t("profileProgress")}</strong>
              <span>{progress}%</span>
            </div>
            <progress max="100" value={progress} />
            <p>{t("profileTip")}</p>
            <Link className="text-link" to="/profile">
              {t("profileComplete")}
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <h2>{t("findTravelers")}</h2>
          <SharedUserSearch />
        </aside>
      </div>
      <p className="home-count" aria-live="polite">
        {t("showingCount", { count })}
      </p>
      {deleteId !== null && (
        <ConfirmDialog
          title={t("deletePostTitle")}
          hint={t("deletePostHint")}
          onClose={() => setDeleteId(null)}
          onConfirm={() => {
            void removePost(deleteId);
            setDeleteId(null);
          }}
        />
      )}
    </main>
  );
}

function InvitePanel({
  trip,
  onChange,
  onError,
}: {
  trip: Trip;
  onChange: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [busy, setBusy] = useState(false);
  const refreshMembers = useCallback(async () => {
    try {
      setMembers(await socialApi.tripMembers(trip.id));
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : t("loadFailed"));
    }
  }, [trip.id, onError, t]);
  useEffect(() => {
    void refreshMembers();
  }, [refreshMembers]);
  useEffect(() => {
    if (query.trim().length < 2) {
      setUsers([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void authApi
        .searchUsers(query.trim())
        .then(setUsers)
        .catch((reason: unknown) =>
          onError(reason instanceof Error ? reason.message : t("searchFailed")),
        );
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, onError, t]);
  async function invite(person: UserSummary) {
    setBusy(true);
    try {
      await socialApi.inviteMember(trip.id, person.username);
      setQuery("");
      setUsers([]);
      await refreshMembers();
      await onChange();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : t("inviteFailed"));
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: number) {
    setBusy(true);
    try {
      await socialApi.removeMember(id);
      await refreshMembers();
    } catch (reason) {
      onError(
        reason instanceof Error ? reason.message : t("removeMemberFailed"),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="invite-panel">
      <label>
        {t("searchToInvite")}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchUsername")}
        />
      </label>
      {users.length > 0 && (
        <ul className="search-results">
          {users.map((person) => (
            <li key={person.id}>
              <UserAvatar
                name={person.nickname || person.username}
                src={person.avatarUrl}
                size="small"
              />
              <div>
                <strong>{person.nickname || person.username}</strong>
                <small>@{person.username}</small>
              </div>
              <button
                className="button button-primary"
                disabled={
                  busy || members.some((member) => member.userId === person.id)
                }
                onClick={() => void invite(person)}
              >
                {members.some((member) => member.userId === person.id)
                  ? t("alreadyMember")
                  : t("invite")}
              </button>
            </li>
          ))}
        </ul>
      )}
      <h4>
        {t("tripMembers")} · {members.length}
      </h4>
      <ul className="member-list">
        {members.map((member) => (
          <li key={member.userId}>
            <UserAvatar
              name={member.nickname}
              src={member.avatarUrl}
              size="small"
            />
            <div>
              <strong>{member.nickname}</strong>
              <small>
                @{member.username} · {t(member.role)}
              </small>
            </div>
            {member.role === "member" && member.id !== null && (
              <button
                className="link-button"
                disabled={busy}
                onClick={() => void remove(member.id!)}
              >
                {t("remove")}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
