import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Buildings, MapPin, Mountains, Tree, Waves } from "@phosphor-icons/react";
import type { Destination, DestinationCategory, Localized } from "../data/destinations";

export const CATEGORY_GLYPH: Record<DestinationCategory, JSX.Element> = {
  heritage: <Buildings size={40} weight="duotone" />,
  nature: <Mountains size={40} weight="duotone" />,
  urban: <Tree size={40} weight="duotone" />,
  island: <Waves size={40} weight="duotone" />,
};

export function currentLanguage(): "zh" | "en" {
  return localStorage.getItem("min-roamer.language") === "en" ? "en" : "zh";
}

export function pickText(value: Localized, language: "zh" | "en") {
  return value[language];
}

export function DestinationCard({
  item,
  distanceLabel,
}: {
  item: Destination;
  /** Optional straight-line distance shown on the cover, used by the nearby recommendations. */
  distanceLabel?: string;
}) {
  const { t } = useTranslation();
  const language = currentLanguage();
  return (
    <Link className="destination-card" to={`/destinations/${item.id}`}>
      <div className={`destination-cover category-${item.category}`}>
        <span className="destination-cover-glyph">{CATEGORY_GLYPH[item.category]}</span>
        <span className="destination-cover-category">
          {t(`dest.${item.category}`)}
        </span>
        {distanceLabel && (
          <span className="destination-cover-distance">{distanceLabel}</span>
        )}
      </div>
      <div className="destination-card-body">
        <h3>{pickText(item.name, language)}</h3>
        <p className="destination-district">
          <MapPin size={13} />
          {pickText(item.district, language)}
          <span className="destination-dot" />
          {pickText(item.duration, language)}
        </p>
        <p className="destination-card-summary">{pickText(item.summary, language)}</p>
        <div className="destination-tags">
          {item.tags.map((tag) => (
            <span key={tag.zh}>{pickText(tag, language)}</span>
          ))}
        </div>
        <div className="destination-card-foot">
          <span>{pickText(item.ticket, language)}</span>
          <ArrowRight size={15} weight="bold" />
        </div>
      </div>
    </Link>
  );
}
