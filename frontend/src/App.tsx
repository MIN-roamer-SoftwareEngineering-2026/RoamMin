import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  Compass,
  SquaresFour,
  UserCircle,
  Users,
  SignOut,
  ArrowUpRight,
  CaretRight,
  Sun,
  Moon,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { authApi } from "./api/auth";
import i18n from "./i18n";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { MyHomePage } from "./pages/MyHomePage";
import { PublicUserPage } from "./pages/PublicUserPage";
import { RegisterPage } from "./pages/RegisterPage";
import { PeoplePage } from "./pages/PeoplePage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { useAuthStore } from "./store/authStore";
import { UserAvatar } from "./components/UserAvatar";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { applyTheme, readTheme, type Theme } from "./theme";

function SessionHydrator() {
  const { token, setUser, clearSession } = useAuthStore();
  const { t } = useTranslation();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    setError(false);
    void authApi
      .me()
      .then((user) => {
        if (active) setUser(user);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        const status = (reason as { status?: number }).status;
        if (status === 401 || status === 403) clearSession();
        else setError(true);
      });
    return () => {
      active = false;
    };
  }, [token, setUser, clearSession, attempt]);
  return error && token ? (
    <div className="session-error" role="alert">
      <span>{t("sessionError")}</span>
      <button
        className="button button-secondary"
        onClick={() => setAttempt((v) => v + 1)}
      >
        {t("retry")}
      </button>
      <button className="link-button" onClick={clearSession}>
        {t("logout")}
      </button>
    </div>
  ) : null;
}

export default function App() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const { pathname } = useLocation();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  useEffect(() => {
    const synchronize = (event: StorageEvent) => {
      if (event.key === "min-roamer.theme") setTheme(readTheme());
    };
    window.addEventListener("storage", synchronize);
    return () => window.removeEventListener("storage", synchronize);
  }, []);
  const hasSidebar = !!user && !["/login", "/register"].includes(pathname);
  const title =
    pathname === "/profile"
      ? t("profile")
      : pathname === "/people"
        ? t("people")
        : pathname.startsWith("/users/")
          ? t("travelerProfile")
          : t("overview");
  async function switchLanguage(language: "zh" | "en") {
    localStorage.setItem("min-roamer.language", language);
    await i18n.changeLanguage(language);
    document.documentElement.lang = language;
  }
  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.title = `${title} · MIN-roamer`;
  }, [title]);
  return (
    <div className={hasSidebar ? "app-frame with-sidebar" : "app-frame"}>
      <SessionHydrator />
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Compass size={25} weight="duotone" />
          </span>
          <span>
            MIN<span className="brand-separator">·</span>roamer
            <small>漫行札记</small>
          </span>
        </Link>
        <div className="topbar-context">
          <span>{t("workspace")}</span>
          <CaretRight size={12} />
          <strong>{title}</strong>
        </div>
        <nav aria-label={t("account")}>
          <div className="theme-switch" role="group" aria-label={t("theme")}>
            <button
              title={t("lightTheme")}
              aria-label={t("lightTheme")}
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
            >
              <Sun size={17} />
              <span>{t("lightTheme")}</span>
            </button>
            <button
              title={t("darkTheme")}
              aria-label={t("darkTheme")}
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
            >
              <Moon size={17} />
              <span>{t("darkTheme")}</span>
            </button>
          </div>
          <div
            className="language-switch"
            role="group"
            aria-label={t("language")}
          >
            <button
              aria-pressed={i18n.language === "zh"}
              onClick={() => void switchLanguage("zh")}
            >
              中
            </button>
            <button
              aria-pressed={i18n.language === "en"}
              onClick={() => void switchLanguage("en")}
            >
              EN
            </button>
          </div>
          {user ? (
            <Link className="account-link" to="/profile">
              <UserAvatar
                name={user.nickname || user.username}
                src={user.avatarUrl}
                size="small"
              />
              <span>{user.nickname || user.username}</span>
            </Link>
          ) : (
            <Link
              className="button button-secondary"
              to={pathname === "/register" ? "/login" : "/register"}
            >
              {pathname === "/register" ? t("login") : t("register")}
              <ArrowUpRight size={16} />
            </Link>
          )}
        </nav>
      </header>
      {hasSidebar && (
        <aside className="app-sidebar">
          <div className="sidebar-section-label">{t("personalNav")}</div>
          <nav aria-label={t("workspace")}>
            <NavLink to="/my">
              <SquaresFour size={21} />
              {t("overview")}
            </NavLink>
            <NavLink to="/people">
              <Users size={21} />
              {t("people")}
            </NavLink>
            <div className="sidebar-section-label">{t("account")}</div>
            <NavLink to="/profile">
              <UserCircle size={21} />
              {t("profile")}
            </NavLink>
          </nav>
          <div className="sidebar-bottom">
            <Compass size={30} weight="thin" />
            <p>{t("brandTagline")}</p>
            <small>MIN-ROAMER / EST. 2026</small>
            <button
              className="sidebar-logout"
              onClick={() => setLogoutOpen(true)}
            >
              <SignOut size={19} />
              {t("logout")}
            </button>
          </div>
        </aside>
      )}
      <div className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/my" element={<MyHomePage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/users/:id" element={<PublicUserPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <footer className="app-footer">
          <span>© 2026 MIN-roamer</span>
          <span>{t("brandTagline")}</span>
        </footer>
      </div>
      {logoutOpen && (
        <ConfirmDialog
          title={t("logoutTitle")}
          hint={t("logoutHint")}
          onClose={() => setLogoutOpen(false)}
          onConfirm={() => {
            clearSession();
            setLogoutOpen(false);
          }}
        />
      )}
    </div>
  );
}
