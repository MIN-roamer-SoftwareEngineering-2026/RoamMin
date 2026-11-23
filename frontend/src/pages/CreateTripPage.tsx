import { useState, type FormEvent } from "react";
import { ArrowLeft, PaperPlaneTilt } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { socialApi } from "../api/social";
import "../trips.css";

export function CreateTripPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    destination: "",
    startDate: "",
    endDate: "",
  });
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
