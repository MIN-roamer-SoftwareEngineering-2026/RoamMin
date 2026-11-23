import { useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { fuzhouSlides } from "./fuzhouSlides";

export function FuzhouCarousel() {
  const { i18n } = useTranslation();
  const en = i18n.language === "en";
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [failed, setFailed] = useState<string[]>([]);
  const touchStart = useRef<number | null>(null);
  const current = fuzhouSlides[index];
  const autoplay = !paused && !hovered && !focused && !hidden && !reducedMotion;

  useEffect(() => {
    const nextImage = new Image();
    nextImage.src = fuzhouSlides[(index + 1) % fuzhouSlides.length].image;
  }, [index]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setHidden(document.hidden);
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(
      () => setIndex((value) => (value + 1) % fuzhouSlides.length),
      5000,
    );
    return () => window.clearTimeout(timer);
  }, [autoplay, index]);

  function move(direction: number) {
    setIndex(
      (value) =>
        (value + direction + fuzhouSlides.length) % fuzhouSlides.length,
    );
  }

  return (
    <section
      className="atlas-hero-art fuzhou-hero-photo fuzhou-carousel"
      aria-label={en ? "Fuzhou landmark photos" : "福州六景轮播"}
      aria-roledescription={en ? "carousel" : "轮播"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
      onTouchStart={(event) => {
        touchStart.current = event.changedTouches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current !== null) {
          const distance = event.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
        }
        touchStart.current = null;
      }}
      onTouchCancel={() => {
        touchStart.current = null;
      }}
    >
      <div className="fuzhou-slide-window">
        <div
          className="fuzhou-slide-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {fuzhouSlides.map((slide, slideIndex) => (
            <div
              className="fuzhou-slide"
              key={slide.id}
              aria-hidden={slideIndex !== index}
            >
              {failed.includes(slide.id) ? (
                <div className="fuzhou-image-fallback">
                  {en ? "Photo unavailable" : "照片暂时无法加载"}
                </div>
              ) : (
                <img
                  src={slide.image}
                  alt={en ? slide.enAlt : slide.zhAlt}
                  loading={slideIndex === 0 ? "eager" : "lazy"}
                  fetchPriority={slideIndex === 0 ? "high" : "auto"}
                  onError={() =>
                    setFailed((items) =>
                      items.includes(slide.id) ? items : [...items, slide.id],
                    )
                  }
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="atlas-art-label">
        <span>FUZHOU / CITY IMPRESSIONS</span>
        <span>{String(index + 1).padStart(2, "0")} / 06</span>
      </div>
      <div className="fuzhou-carousel-bottom">
        <div
          className="fuzhou-photo-caption"
          aria-live={autoplay ? "off" : "polite"}
          aria-atomic="true"
        >
          <h2>{en ? current.en : current.zh}</h2>
          <span>
            {en ? current.enCaption : current.zhCaption} · {current.date}
          </span>
          <small>
            <a
              href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(current.file)}`}
              target="_blank"
              rel="noreferrer"
            >
              {en ? "Photo" : "摄影"} {current.author}
            </a>{" "}
            ·{" "}
            <a href={current.licenseUrl} target="_blank" rel="noreferrer">
              {current.license}
            </a>{" "}
            · {en ? "Display crop" : "展示裁切"}
          </small>
        </div>
        <div className="fuzhou-carousel-controls">
          <button
            type="button"
            aria-label={en ? "Previous photo" : "上一张"}
            onClick={() => move(-1)}
          >
            <CaretLeft size={18} />
          </button>
          <div
            className="fuzhou-carousel-dots"
            role="group"
            aria-label={en ? "Choose a landmark" : "选择景点"}
          >
            {fuzhouSlides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                aria-label={en ? `Show ${slide.en}` : `切换到${slide.zh}`}
                aria-pressed={index === slideIndex}
                onClick={() => setIndex(slideIndex)}
              >
                <span />
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label={en ? "Next photo" : "下一张"}
            onClick={() => move(1)}
          >
            <CaretRight size={18} />
          </button>
          {!reducedMotion && (
            <button
              type="button"
              aria-label={
                paused
                  ? en
                    ? "Resume slideshow"
                    : "继续轮播"
                  : en
                    ? "Pause slideshow"
                    : "暂停轮播"
              }
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
