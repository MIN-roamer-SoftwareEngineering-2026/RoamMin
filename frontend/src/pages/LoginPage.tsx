import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthScenery } from "../components/AuthScenery";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/auth";
import { useAuthStore } from "../store/authStore";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const destination =
    from?.startsWith("/") && !from.startsWith("//") ? from : "/my";
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const session = await authApi.login({ email: email.trim(), password });
      setSession(session.token, session.user);
      navigate(destination, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  if (user) return <Navigate to={destination} replace />;
  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <Link className="auth-brand" to="/">
          MIN-roamer <span>/ JOURNEY WITH PURPOSE</span>
        </Link>
        <div className="auth-heading">
          <p className="eyebrow">{t("welcomeBack")}</p>
          <h1 id="auth-title">{t("loginTitle")}</h1>
          <p className="muted">{t("loginPrompt")}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            {t("email")}
            <input
              type="email"
              placeholder={t("enterEmail")}
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
              autoComplete="current-password"
              minLength={8}
              maxLength={72}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {busy ? t("loggingIn") : t("login")}
          </button>
        </form>
        <p className="auth-switch">
          {t("noAccountLead")}{" "}
          <Link className="text-link" to="/register">
            {t("register")}
          </Link>
        </p>
      </section>
      <AuthScenery />
    </main>
  );
}
