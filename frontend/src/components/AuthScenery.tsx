import { Compass } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
export function AuthScenery() {
  const { t } = useTranslation();
  return (
    <aside className="auth-aside">
      <div className="scenery-top">
        <Compass size={28} weight="thin" />
        <span>THE WORLD IS WAITING.</span>
      </div>
      <div className="scenery-copy">
        <p className="aside-kicker">MIN-ROAMER · JOURNEY WITH PURPOSE</p>
        <p className="aside-title">{t("authAsideTitle")}</p>
        <p className="aside-caption">{t("authAsideCaption")}</p>
      </div>
      <span className="aside-coordinate">
        {t("authEyebrow")}
        <span>01 / ∞</span>
      </span>
    </aside>
  );
}
