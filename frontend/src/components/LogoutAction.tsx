import { useState } from "react";
import { SignOut } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { ConfirmDialog } from "./ConfirmDialog";

type LogoutActionProps = {
  className?: string;
};

/**
 * Shared logout button with confirmation.
 * Used by the sidebar and the profile page so both entry points behave the same.
 */
export function LogoutAction({ className = "sidebar-logout" }: LogoutActionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        <SignOut size={19} />
        {t("logout")}
      </button>
      {open && (
        <ConfirmDialog
          title={t("logoutTitle")}
          hint={t("logoutHint")}
          onClose={() => setOpen(false)}
          onConfirm={() => {
            setOpen(false);
            clearSession();
            navigate("/");
          }}
        />
      )}
    </>
  );
}
