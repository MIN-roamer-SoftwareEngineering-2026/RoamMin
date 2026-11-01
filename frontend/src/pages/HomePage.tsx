import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/authStore";

export function HomePage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  if (user) return <Navigate to="/my" replace />;

  return (
    <main className="page-shell home-layout">
      <p className="eyebrow">MIN-ROAMER / FUZHOU</p>
      <h1>{t("brandIntro")}</h1>
      <p className="lead">{t("authFootnote")}</p>
      {status === "loading" ? (
        <p className="status-line" role="status">
          {t("loading")}
        </p>
      ) : (
        <div className="action-row">
          <Link className="button button-primary" to="/register">
            {t("register")}
          </Link>
          <Link className="button button-secondary" to="/login">
            {t("login")}
          </Link>
        </div>
      )}
    </main>
  );
}
