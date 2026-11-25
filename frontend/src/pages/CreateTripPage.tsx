import { useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  ArrowLeft,
  CaretDown,
  MapPin,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { socialApi } from "../api/social";
import { DESTINATION_SAMPLES } from "../data/destinations";
import "../trips.css";

export function CreateTripPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    destination: "",
    startDate: "",
    endDate: "",
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const language = i18n.language.startsWith("en") ? "en" : "zh";

  const matchingDestinations = useMemo(() => {
    const keyword = form.destination.trim().toLocaleLowerCase();
    if (!keyword) return DESTINATION_SAMPLES;
    return DESTINATION_SAMPLES.filter((destination) =>
      [
        destination.name.zh,
        destination.name.en,
        destination.district.zh,
        destination.district.en,
        destination.address.zh,
        destination.address.en,
      ].some((value) => value.toLocaleLowerCase().includes(keyword)),
    );
  }, [form.destination]);

  function chooseDestination(index: number) {
    const destination = matchingDestinations[index];
    if (!destination) return;
    setForm({ ...form, destination: destination.name[language] });
    setPickerOpen(false);
    setActiveIndex(-1);
  }

  function handleDestinationKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setPickerOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (matchingDestinations.length === 0) return;
      setPickerOpen(true);
      setActiveIndex((current) =>
        event.key === "ArrowDown"
          ? current < matchingDestinations.length - 1
            ? current + 1
            : 0
          : current > 0
            ? current - 1
            : matchingDestinations.length - 1,
      );
      return;
    }
    if (event.key === "Enter" && pickerOpen && activeIndex >= 0) {
      event.preventDefault();
      chooseDestination(activeIndex);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    const destination = form.destination.trim();
    if (!title || !destination) {
      setError(`${t("tripName")} / ${t("destination")}: ${t("saveFailed")}`);
      return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError(`${t("startDate")} / ${t("endDate")}: ${t("saveFailed")}`);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const trip = await socialApi.createTrip({
        title,
        destination,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      });
      navigate(`/trips?created=${trip.id}`, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("saveFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell trip-page">
      <header className="trip-page-heading">
        <div>
          <p className="trip-eyebrow">{t("personalSpace")}</p>
          <h1>{t("createTrip")}</h1>
          <p>{t("privateTrip")}</p>
        </div>
        <Link className="button button-secondary" to="/trips">
          <ArrowLeft size={17} />
          {t("myTrips")}
        </Link>
      </header>
      <form
        className="trip-form-panel"
        onSubmit={(event) => void submit(event)}
        noValidate
      >
        <label>
          {t("tripName")}
          <input
            autoFocus
            required
            maxLength={80}
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
          />
        </label>
        <label>
          {t("destination")}
          <div className="destination-picker">
            <input
              required
              maxLength={80}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={pickerOpen}
              aria-controls="trip-destination-options"
              aria-activedescendant={
                activeIndex >= 0
                  ? `trip-destination-option-${activeIndex}`
                  : undefined
              }
              placeholder={t("destinationSearchPlaceholder")}
              value={form.destination}
              onFocus={() => setPickerOpen(true)}
              onKeyDown={handleDestinationKeyDown}
              onChange={(event) => {
                setForm({ ...form, destination: event.target.value });
                setPickerOpen(true);
                setActiveIndex(-1);
              }}
            />
            <button
              className="destination-picker-toggle"
              type="button"
              aria-label={t("destinationPickerToggle")}
              aria-expanded={pickerOpen}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setPickerOpen((open) => !open)}
            >
              <CaretDown size={16} weight="bold" />
            </button>
            {pickerOpen && (
              <div
                id="trip-destination-options"
                className="destination-picker-options"
                role="listbox"
              >
                {matchingDestinations.length > 0 ? (
                  matchingDestinations.map((destination, index) => (
                    <button
                      id={`trip-destination-option-${index}`}
                      className={
                        index === activeIndex ? "is-active" : undefined
                      }
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      key={destination.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => chooseDestination(index)}
                    >
                      <MapPin size={16} aria-hidden="true" />
                      <span>
                        <strong>{destination.name[language]}</strong>
                        <small>{destination.district[language]}</small>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="destination-picker-empty" role="status">
                    {t("destinationNoMatches")}
                  </p>
                )}
              </div>
            )}
          </div>
        </label>
        <div className="trip-date-fields">
          <label>
            {t("startDate")}
            <input
              type="date"
              value={form.startDate}
              onChange={(event) =>
                setForm({ ...form, startDate: event.target.value })
              }
            />
          </label>
          <label>
            {t("endDate")}
            <input
              type="date"
              min={form.startDate || undefined}
              value={form.endDate}
              onChange={(event) =>
                setForm({ ...form, endDate: event.target.value })
              }
            />
          </label>
        </div>
        {error && (
          <p className="trip-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="trip-form-actions">
          <span>{t("privateTrip")}</span>
          <button
            className="button button-primary"
            type="submit"
            disabled={submitting}
          >
            <PaperPlaneTilt size={17} />
            {submitting ? `${t("createTrip")}...` : t("createTrip")}
          </button>
        </div>
      </form>
    </main>
  );
}
