import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthScenery } from "../components/AuthScenery";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/auth";
import { useAuthStore } from "../store/authStore";

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (password !== confirmation) {
      setError(t("passwordMismatch"));
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError(t("passwordBytes"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const session = await authApi.register({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      setSession(session.token, session.user);
      navigate("/profile", { replace: true });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Registration failed",
      );
    } finally {
      setBusy(false);
    }
  }

  if (user) return <Navigate to="/profile" replace />;
  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <Link className="auth-brand" to="/">
          MIN-roamer <span>/ JOURNEY WITH PURPOSE</span>
        </Link>
        <div className="auth-heading">
          <p className="eyebrow">{t("startHere")}</p>
          <h1 id="auth-title">{t("registerTitle")}</h1>
          <p className="muted">{t("registerPrompt")}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            {t("username")}
            <input
              autoComplete="username"
              minLength={2}
              maxLength={50}
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label>
            {t("email")}
            <input
              type="email"
              autoComplete="email"
              maxLength={100}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            {t("password")}
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <p className="field-hint">{t("passwordsHint")}</p>
          <label>
            {t("passwordConfirm")}
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
            />
            {t("showPassword")}
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button button-primary full-width"
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? t("registering") : t("register")}
          </button>
        </form>
        <p className="auth-switch">
          {t("haveAccountLead")}{" "}
          <Link className="text-link" to="/login">
            {t("login")}
          </Link>
        </p>
      </section>
      <AuthScenery />
    </main>
  );
}
