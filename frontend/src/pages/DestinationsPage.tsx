import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Buildings, MagnifyingGlass, Mountains, Tree, Waves } from "@phosphor-icons/react";
import { listDestinations, type DestinationList } from "../api/destinations";
import { CATEGORY_ORDER, type DestinationCategory } from "../data/destinations";
import { DestinationCard, currentLanguage } from "../components/DestinationCard";

type CategoryFilter = "all" | DestinationCategory;
type SortOrder = "heat" | "name";

const CATEGORY_GLYPH: Record<DestinationCategory, JSX.Element> = {
  heritage: <Buildings size={16} weight="duotone" />,
  nature: <Mountains size={16} weight="duotone" />,
  urban: <Tree size={16} weight="duotone" />,
  island: <Waves size={16} weight="duotone" />,
};

export function DestinationsPage() {
  const { t } = useTranslation();
  const language = currentLanguage();
  const [data, setData] = useState<DestinationList | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<SortOrder>("heat");

  const load = useCallback(async () => {
    setLoading(true);
    const result = await listDestinations();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => data?.items ?? [], [data]);

  const filtered = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    const matched = items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!needle) return true;
      const haystack = [
        item.name.zh,
        item.name.en,
        item.district.zh,
        item.district.en,
        item.summary.zh,
        item.summary.en,
        ...item.tags.flatMap((tag) => [tag.zh, tag.en]),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
    return matched.sort((a, b) => {
      if (sort === "name") {
        return a.name[language].localeCompare(b.name[language], language === "en" ? "en" : "zh-Hans-CN");
      }
      return b.heat - a.heat;
    });
  }, [items, keyword, category, sort, language]);

  return (
    <main className="page-shell destination-page">
      <header className="destination-heading">
        <div>
          <p className="eyebrow">{t("dest.eyebrow")}</p>
          <h1>{t("dest.title")}</h1>
          <p className="lead">{t("dest.lead")}</p>
        </div>
        <div className="destination-source">
          <span
            className={`destination-source-badge ${data?.source === "api" ? "is-api" : ""}`}
          >
            {data?.source === "api" ? t("dest.apiBadge") : t("dest.sampleBadge")}
          </span>
          {data?.source === "sample" ? (
            <small>{data.reason === "empty" ? t("dest.sampleEmpty") : t("dest.sampleOffline")}</small>
          ) : (
            <small>{t("dest.sourceNote")}</small>
          )}
        </div>
      </header>

      <section className="destination-toolbar">
        <label className="destination-search">
          <MagnifyingGlass size={17} />
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t("dest.searchPlaceholder")}
            aria-label={t("dest.search")}
          />
        </label>
        <div className="destination-chips" role="group" aria-label={t("dest.category")}>
          <button
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            {t("dest.all")}
          </button>
          {CATEGORY_ORDER.map((key) => (
            <button
              key={key}
              aria-pressed={category === key}
              onClick={() => setCategory(key)}
            >
              {CATEGORY_GLYPH[key]}
              {t(`dest.${key}`)}
            </button>
          ))}
        </div>
        <label className="destination-sort">
          <span>{t("dest.sort")}</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOrder)}
          >
            <option value="heat">{t("dest.sortHeat")}</option>
            <option value="name">{t("dest.sortName")}</option>
          </select>
        </label>
      </section>

      {loading ? (
        <p className="status-line" role="status">
          {t("dest.loading")}
        </p>
      ) : (
        <>
          <p className="destination-count">
            {t("dest.resultCount", { total: items.length, shown: filtered.length })}
          </p>
          {filtered.length ? (
            <div className="destination-grid">
              {filtered.map((item) => (
                <DestinationCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="empty-state destination-empty">
              <p>{t("dest.empty")}</p>
              <button
                className="button button-secondary"
                onClick={() => {
                  setKeyword("");
                  setCategory("all");
                }}
              >
                {t("dest.all")}
              </button>
            </div>
          )}
        </>
      )}

    </main>
  );
}
