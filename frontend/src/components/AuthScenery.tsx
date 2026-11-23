import { useState } from "react";
import { MapPin, Path } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { fuzhouSlides } from "./fuzhouSlides";

const walk = ["sanfangqixiang", "shangxiahang", "zhongzhou"].map((id) =>
  fuzhouSlides.find((slide) => slide.id === id)!,
);

export function AuthScenery() {
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith("en");
  const [index, setIndex] = useState(walk.length - 1);
  const place = walk[index];
  return (
    <aside
      className="journey-guide"
      aria-label={en ? "Fuzhou city walk" : "福州漫游路线"}
    >
      <figure className="journey-photo">
        <img src={place.image} alt={en ? place.enAlt : place.zhAlt} />
        <span className="journey-location">
          <MapPin size={16} weight="fill" aria-hidden="true" />
          {en ? "Fuzhou, Fujian" : "福建 · 福州"}
        </span>
        <figcaption aria-live="polite">
          <h2>{en ? place.en : place.zh}</h2>
          <p>{en ? place.enCaption : place.zhCaption}</p>
          <small>
            <a
              href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(place.file)}`}
              target="_blank"
              rel="noreferrer"
            >
              {place.author}
            </a>
            {" · "}
            <a href={place.licenseUrl} target="_blank" rel="noreferrer">
              {place.license}
            </a>
            {" · "}
            {en ? "Cropped" : "画面裁切"}
          </small>
        </figcaption>
      </figure>
      <div className="journey-route">
        <h3>
          <Path size={18} aria-hidden="true" />
          {en ? "From old town to riverfront" : "从老街到江畔"}
        </h3>
        <div
          className="journey-stops"
          role="group"
          aria-label={en ? "Preview a stop" : "选择站点查看实景"}
        >
          {walk.map((stop, position) => (
            <button
              key={stop.id}
              type="button"
              aria-pressed={position === index}
              onClick={() => setIndex(position)}
            >
              <span className="stop-dot" aria-hidden="true" />
              {en ? (position === 0 ? "Sanfang Qixiang" : stop.en) : stop.zh}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
