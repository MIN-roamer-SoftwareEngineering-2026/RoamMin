import { useTranslation } from "react-i18next";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);
  const { t } = useTranslation();
  const location = useLocation();

  if (status === "loading")
    return <main className="page-shell">{t("loading")}</main>;
  if (status !== "authenticated")
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}
