import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
export function ConfirmDialog({
  title,
  hint,
  onConfirm,
  onClose,
}: {
  title: string;
  hint: string;
  onConfirm: () => void;
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
      aria-labelledby="confirm-title"
      onCancel={onClose}
    >
      <h2 id="confirm-title">{title}</h2>
      <p>{hint}</p>
      <div className="dialog-actions">
        <button className="button button-secondary" autoFocus onClick={onClose}>
          {t("cancel")}
        </button>
        <button className="button button-primary" onClick={onConfirm}>
          {t("confirmAction")}
        </button>
      </div>
    </dialog>
  );
}
