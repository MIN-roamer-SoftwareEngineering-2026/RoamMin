import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock,
  Crosshair,
  Hourglass,
  Leaf,
  MapPin,
  Sparkle,
  Ticket,
} from "@phosphor-icons/react";
import { getDestination } from "../api/destinations";
import { DESTINATION_SAMPLES, type Destination } from "../data/destinations";
import { CATEGORY_GLYPH, DestinationCard, currentLanguage, pickText } from "../components/DestinationCard";
import { useAuthStore } from "../store/authStore";

export function DestinationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const language = currentLanguage();
  const user = useAuthStore((state) => state.user);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getDestination(id ?? "").then((result) => {
      if (!active) return;
      setDestination(result);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="page-shell destination-detail-page">
        <p className="status-line" role="status">
          {t("dest.loading")}
        </p>
      </main>
    );
  }

  if (!destination) {
    return (
      <main className="page-shell destination-detail-page">
        <p className="empty-state">{t("dest.notFound")}</p>
        <div className="destination-detail-actions">
          <Link className="button button-secondary" to="/destinations">
            <ArrowLeft size={16} />
            {t("dest.back")}
          </Link>
        </div>
      </main>
    );
  }

  const related = DESTINATION_SAMPLES.filter(
    (item) => item.category === destination.category && item.id !== destination.id,
  ).slice(0, 3);

  const facts = [
    {
      key: "address",
      label: t("dest.address"),
      value: pickText(destination.address, language),
      icon: <MapPin size={17} />,
    },
    {
      key: "hours",
      label: t("dest.hours"),
      value: pickText(destination.hours, language),
      icon: <Clock size={17} />,
    },
    {
      key: "ticket",
      label: t("dest.ticket"),
      value: pickText(destination.ticket, language),
      icon: <Ticket size={17} />,
    },
    {
      key: "duration",
      label: t("dest.duration"),
      value: pickText(destination.duration, language),
      icon: <Hourglass size={17} />,
    },
    {
      key: "bestSeason",
      label: t("dest.bestSeason"),
      value: pickText(destination.bestSeason, language),
      icon: <Leaf size={17} />,
    },
    {
      key: "coords",
      label: t("dest.coords"),
      value: `${destination.coords.lat.toFixed(4)}, ${destination.coords.lng.toFixed(4)}`,
      icon: <Crosshair size={17} />,
    },
  ];

  return (
    <main className="page-shell destination-detail-page">
      <Link className="destination-back" to="/destinations">
        <ArrowLeft size={15} />
        {t("dest.back")}
      </Link>

      <section className={`destination-hero category-${destination.category}`}>
        <div className="destination-hero-copy">
          <p className="eyebrow">{t("dest.detailEyebrow")}</p>
          <h1>{pickText(destination.name, language)}</h1>
          <p className="destination-hero-meta">
            <MapPin size={14} />
            {pickText(destination.district, language)}
            <span className="destination-dot" />
            {t(`dest.${destination.category}`)}
            <span className="destination-dot" />
            {t("dest.heat")} {destination.heat}
          </p>
          <p className="destination-hero-summary">
            {pickText(destination.summary, language)}
          </p>
          <div className="destination-tags">
            {destination.tags.map((tag) => (
              <span key={tag.zh}>{pickText(tag, language)}</span>
            ))}
          </div>
        </div>
        <div className="destination-hero-glyph" aria-hidden>
          {CATEGORY_GLYPH[destination.category]}
        </div>
      </section>

      <dl className="destination-facts">
        {facts.map((fact) => (
          <div key={fact.key}>
            <dt>
              {fact.icon}
              {fact.label}
            </dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>

      <section className="destination-highlights">
        <h2>
          <Sparkle size={18} weight="duotone" />
          {t("dest.highlights")}
        </h2>
        <ol>
          {destination.highlights.map((highlight, index) => (
            <li key={highlight.zh}>
              <span className="destination-highlight-index">{index + 1}</span>
              {pickText(highlight, language)}
            </li>
          ))}
        </ol>
      </section>

      <div className="destination-detail-actions">
        <Link className="button button-primary" to={user ? "/my" : "/login"}>
          {user ? t("dest.planTrip") : t("dest.loginToPlan")}
          <ArrowUpRight size={16} />
        </Link>
        <p className="field-hint">{t("dest.sourceNote")}</p>
      </div>

      {related.length > 0 && (
        <section className="destination-related">
          <h2>{t("dest.related")}</h2>
          <div className="destination-grid">
            {related.map((item) => (
              <DestinationCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
