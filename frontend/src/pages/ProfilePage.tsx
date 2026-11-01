import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/auth";
import i18n from "../i18n";
import { useAuthStore } from "../store/authStore";
import { UserAvatar } from "../components/UserAvatar";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  LockKey,
  UserCircle,
} from "@phosphor-icons/react";

export function ProfilePage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [language, setLanguage] = useState<"zh" | "en">("zh");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setNickname(user.nickname || user.username);
    setAvatarUrl(user.avatarUrl || "");
    setBio(user.bio || "");
    setLanguage(user.language || "zh");
    // Avatar uploads update the store too; only initialize when the account changes.
    // This keeps an upload from overwriting the current nickname/bio draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const dirty =
    !!user &&
    (nickname !== (user.nickname || user.username) ||
      bio !== (user.bio || "") ||
      language !== user.language);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function resetDraft() {
    if (!user) return;
    setNickname(user.nickname || user.username);
    setBio(user.bio || "");
    setLanguage(user.language);
    setNotice("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || avatarBusy || !nickname.trim()) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await authApi.updateProfile({
        nickname: nickname.trim(),
        avatarUrl,
        bio: bio.trim(),
        language,
      });
      setUser(updated);
      setNickname(updated.nickname);
      setBio(updated.bio || "");
      localStorage.setItem("min-roamer.language", updated.language);
      await i18n.changeLanguage(updated.language);
      setNotice(t("saved"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (
      !["image/png", "image/jpeg"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError(t("avatarInvalid"));
      input.value = "";
      return;
    }
    setAvatarBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await authApi.uploadAvatar(file);
      setUser(updated);
      setAvatarUrl(updated.avatarUrl || "");
      setNotice(t("avatarUploaded"));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : t("avatarUploadFailed"),
      );
    } finally {
      setAvatarBusy(false);
      input.value = "";
    }
  }

  return (
    <main className="page-shell profile-page">
      <Link className="back-link" to="/my">
        <ArrowLeft size={16} />
        {t("backHome")}
      </Link>
      <header className="page-heading">
        <div>
          <p className="eyebrow">YOUR TRAVELER IDENTITY</p>
          <h1>{t("profile")}</h1>
          <p className="muted">{t("profilePrompt")}</p>
        </div>
      </header>

      <div className="profile-grid">
        <aside className="profile-summary" aria-label={t("accountSummary")}>
          <p className="eyebrow">{t("preview")}</p>
          <div className="profile-identity">
            <UserAvatar
              key={avatarUrl}
              name={nickname || user?.username || ""}
              src={avatarUrl}
            />
            <div className="identity-copy">
              <h2>{nickname || user?.username}</h2>
              <p>@{user?.username}</p>
            </div>
          </div>
          <p className="profile-bio">{bio || t("bioEmpty")}</p>
          <dl className="account-facts">
            <div>
              <dt>{t("email")}</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>{t("accountStatus")}</dt>
              <dd>
                <span className="status-dot" />
                {t("accountActive")}
              </dd>
            </div>
          </dl>
          <p className="field-hint privacy-note">
            <LockKey size={17} />
            {t("publicHint")}
          </p>
        </aside>

        <section
          className="settings-section"
          aria-labelledby="profile-form-title"
        >
          <div className="section-heading">
            <h2 id="profile-form-title">
              <UserCircle size={22} />
              {t("personalInformation")}
            </h2>
            <p>{t("personalInformationPrompt")}</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="avatar-editor">
              <UserAvatar
                name={nickname || user?.username || ""}
                src={avatarUrl}
              />
              <div>
                <label className="button button-secondary avatar-upload">
                  <Camera size={18} />
                  {avatarBusy ? t("avatarUploading") : t("avatarAction")}
                  <input
                    aria-label={t("avatarUpload")}
                    type="file"
                    accept="image/png,image/jpeg"
                    disabled={avatarBusy || busy}
                    onChange={handleAvatarChange}
                  />
                </label>
                <p className="field-hint">{t("avatarHint")}</p>
              </div>
            </div>
            <label>
              {t("nickname")}
              <input
                autoComplete="nickname"
                maxLength={50}
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </label>
            <label>
              {t("bio")}
              <textarea
                aria-label={t("bio")}
                rows={4}
                maxLength={500}
                placeholder={t("enterBio")}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <span className="field-meta">
                {t("bioHint")}
                <span>{bio.length}/500</span>
              </span>
            </label>
            <label>
              {t("language")}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "zh" | "en")}
              >
                <option value="zh">{t("zh")}</option>
                <option value="en">{t("en")}</option>
              </select>
            </label>
            {notice && (
              <p className="form-success" role="status">
                <CheckCircle size={17} />
                {notice}
              </p>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button
                className="button button-primary"
                disabled={busy || avatarBusy || !dirty || !nickname.trim()}
                aria-busy={busy}
              >
                {busy ? t("saving") : t("save")}
              </button>
              <button
                className="button button-secondary"
                type="button"
                disabled={!dirty || busy}
                onClick={resetDraft}
              >
                {t("reset")}
              </button>
              <span className="field-hint" aria-live="polite">
                {dirty ? t("unsaved") : t("noChanges")}
              </span>
            </div>
          </form>
          <section className="account-readonly">
            <h3>
              <LockKey size={19} />
              {t("accountDetails")}
            </h3>
            <p className="field-hint">{t("emailPrivate")}</p>
            <dl>
              <div>
                <dt>{t("usernameReadonly")}</dt>
                <dd>@{user?.username}</dd>
              </div>
              <div>
                <dt>{t("emailReadonly")}</dt>
                <dd>{user?.email}</dd>
              </div>
            </dl>
          </section>
        </section>
      </div>
    </main>
  );
}
