import {
  ArrowRight,
  MapTrifold,
  BookmarkSimple,
  Users,
} from "@phosphor-icons/react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/authStore";
import "./home.css";
import { FuzhouCarousel } from "../components/FuzhouCarousel";

export function HomePage() {
  const { i18n, t } = useTranslation();
  const { user, status } = useAuthStore();
  const en = i18n.language === "en";
  if (user) return <Navigate to="/my" replace />;
  const features = en
    ? ["Collect inspiration", "Plan your journey", "Find your people"]
    : ["收藏旅行灵感", "整理自己的行程", "找到同行的人"];
  return (
    <main className="atlas-home">
      <section className="atlas-home-hero" aria-labelledby="travel-title">
        <div className="atlas-hero-copy">
          <h1 id="travel-title">
            <span className="city-signature" lang="en" aria-hidden="true">
              Fuzhou
            </span>
            {en ? "A traveler’s guide to Fuzhou" : "福州漫游手记"}
          </h1>
          <p className="atlas-home-lead">
            {en
              ? "Explore the old lanes, save your favorite places and plan a trip together."
              : "走进老街，收藏沿途的风景，和同行的人一起安排行程。"}
          </p>
          {status === "loading" ? (
            <p role="status">{t("loading")}</p>
          ) : (
            <div className="atlas-home-actions">
              <Link className="button button-primary" to="/register">
                {en ? "Plan my Fuzhou trip" : "开启福州漫游"}
                <ArrowRight size={18} />
              </Link>
              <Link className="atlas-login" to="/login">
                {en ? "I have an account" : "已有账号，继续旅程"}
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </section>
      <section
        className="fuzhou-places"
        aria-labelledby="fuzhou-places-heading"
        id="field-notes"
      >
        <div className="atlas-section-heading">
          <h2 id="fuzhou-places-heading">
            {en ? "City field notes" : "城市手记"}
          </h2>
        </div>
        <div className="city-guide-layout">
          <FuzhouCarousel />
          <div className="fuzhou-place-list">
            {(en
              ? [
                  {
                    name: "Sanfang Qixiang",
                    tag: "LANES & ALLEYS",
                    text: "Leave time for a walk along Nanhou Street and a detour into the lanes.",
                  },
                  {
                    name: "Shangxiahang",
                    tag: "OLD TOWN WALK",
                    text: "Slow down in the old streets and add a local food stop to your plans.",
                  },
                  {
                    name: "Yantai Hill",
                    tag: "AN AFTERNOON OUT",
                    text: "Save an afternoon for a stroll, photographs and a break at a small café.",
                  },
                ]
              : [
                  {
                    name: "三坊七巷",
                    tag: "街巷与古厝",
                    text: "沿南后街慢慢走，再拐进一条小巷，给榕城的第一面留足时间。",
                  },
                  {
                    name: "上下杭",
                    tag: "老城漫步",
                    text: "把脚步放慢，逛逛老街，也为一份福州小吃留个位置。",
                  },
                  {
                    name: "烟台山",
                    tag: "午后散步",
                    text: "留一个午后给散步、拍照，或在街边小店歇一歇。",
                  },
                ]
            ).map((place) => (
              <article key={place.name}>
                <span className="atlas-label">{place.tag}</span>
                <h3>{place.name}</h3>
                <p>{place.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        id="travel-tools"
        className="atlas-home-features"
        aria-labelledby="atlas-features-title"
      >
        <div className="atlas-section-heading">
          <h2 id="atlas-features-title">{en ? "Travel tools" : "旅行工具"}</h2>
        </div>
        <div className="atlas-feature-list">
          {[BookmarkSimple, MapTrifold, Users].map((Icon, index) => (
            <article key={features[index]}>
              <Icon size={28} weight="light" />
              <h3>{features[index]}</h3>
              <p>
                {
                  (en
                    ? [
                        "Keep public trips you love in your favorites. Save a little inspiration for later.",
                        "Create a trip, choose your destination and dates, and keep your plans together.",
                        "Search for travelers, explore their public plans, and invite friends along.",
                      ]
                    : [
                        "收藏喜欢的公开行程，让每个心动的念头，都有一个可以找回的地方。",
                        "确定目的地和日期，创建属于自己的行程，让旅途慢慢有了轮廓。",
                        "按用户名找到旅行伙伴，看看彼此的公开计划，再邀请朋友一起出发。",
                      ])[index]
                }
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
