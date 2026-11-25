import { useState, type FormEvent } from "react";
import { ArrowLeft, PaperPlaneTilt } from "@phosphor-icons/react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { socialApi } from "../api/social";
import { DESTINATION_SAMPLES, type Localized } from "../data/destinations";
import "../trips.css";

function readLanguage(): "zh" | "en" {
  return localStorage.getItem("min-roamer.language") === "en" ? "en" : "zh";
}

function presetTitle(name: Localized, language: "zh" | "en"): string {
  return language === "en" ? `A weekend in ${name.en}` : `${name.zh}周末行程`;
}

export function CreateTripPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Team C hand-off: the destination detail page links here with ?from=<destination id>.
  // Only the two text fields are prefilled; everything below stays Team B's form logic.
  const presetFrom = searchParams.get("from");
  const preset =
    DESTINATION_SAMPLES.find((item) => item.id === presetFrom) ?? null;
  const language = readLanguage();
  const presetName = preset ? preset.name[language] : "";
  const [form, setForm] = useState(() => ({
    title: preset ? presetTitle(preset.name, language) : "",
    destination: presetName,
    startDate: "",
    endDate: "",
  }));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        {preset && (
          <p className="field-hint" role="status">
            {t("dest.prefillFrom", { name: presetName })}{" "}
            <Link className="link-button" to={`/destinations/${preset.id}`}>
              {t("dest.backToDestination", { name: presetName })}
            </Link>
          </p>
        )}
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
          <input
            required
            maxLength={80}
            value={form.destination}
            onChange={(event) =>
              setForm({ ...form, destination: event.target.value })
            }
          />
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
