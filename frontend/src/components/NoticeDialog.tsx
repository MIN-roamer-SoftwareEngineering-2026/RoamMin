import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export function NoticeDialog({
  title,
  message,
  onClose,
}: {
  title: string;
  message: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useTranslation();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby="notice-title"
      onCancel={onClose}
      onClose={onClose}
    >
      <h2 id="notice-title">{title}</h2>
      <p>{message}</p>
      <div className="dialog-actions">
        <button className="button button-primary" autoFocus onClick={onClose}>
          {t("gotIt")}
        </button>
      </div>
    </dialog>
  );
}
