import { Users } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { UserSearch } from "../components/UserSearch";
export function PeoplePage() {
  const { t } = useTranslation();
  return (
    <main className="page-shell people-page">
      <p className="eyebrow">MEET YOUR PEOPLE</p>
      <h1>{t("people")}</h1>
      <p className="muted">{t("findTravelersPrompt")}</p>
      <section className="people-panel">
        <Users size={36} weight="duotone" />
        <h2>{t("searchIdle")}</h2>
        <p className="muted">{t("searchPeopleHint")}</p>
        <UserSearch />
      </section>
    </main>
  );
}
