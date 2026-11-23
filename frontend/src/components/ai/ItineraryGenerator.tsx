import { useState, type FormEvent } from "react";
import { MapTrifold, Path, Sparkle } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { aiApi, aiErrorKey } from "../../api/ai";
import type { ItineraryDraft } from "../../types";

export function ItineraryGenerator() {
  const { t, i18n } = useTranslation();
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("3");
  const [budget, setBudget] = useState("");
  const [preferences, setPreferences] = useState("");
  const [requirements, setRequirements] = useState("");
  const [draft, setDraft] = useState<ItineraryDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [failed, setFailed] = useState(false);
  const language = i18n.language === "en" ? "en" : "zh";
  const currency = new Intl.NumberFormat(language, {
    style: "currency",
    currency: "CNY",
  });

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setFailed(false);
    const interests = preferences
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (!destination.trim()) {
      setError("aiDestinationRequired");
      return;
    }
    if (interests.length > 6 || interests.some((item) => item.length > 80)) {
      setError("aiPreferencesHint");
      return;
    }

    setError("");
    setBusy(true);
    try {
      const result = await aiApi.generate({
        destination: destination.trim(),
        days: Number(days),
        budget: budget === "" ? undefined : Number(budget),
        preferences: interests,
        requirements: requirements.trim() || undefined,
        language,
      });
      setDraft(result);
    } catch (reason) {
      setError(aiErrorKey(reason));
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ai-itinerary">
      <section
        className="ai-card ai-input-card"
        aria-labelledby="ai-trip-details"
      >
        <h2 id="ai-trip-details">{t("aiTripDetails")}</h2>
        <form onSubmit={generate} className="ai-form">
          <fieldset disabled={busy} className="ai-fields">
            <label>
              {t("destination")}
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={t("aiDestinationPlaceholder")}
                required
                maxLength={80}
              />
            </label>
            <div className="ai-number-fields">
              <label>
                {t("aiDays")}
                <input
                  type="number"
                  required
                  min={1}
                  max={14}
                  step={1}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              </label>
              <label>
                {t("aiBudget")}
                <input
                  type="number"
                  min={0}
                  max={1_000_000}
                  step={0.01}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </label>
            </div>
            <label>
              {t("aiPreferences")}
              <input
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder={t("aiPreferencesPlaceholder")}
                aria-describedby="ai-interests-hint"
                maxLength={500}
              />
              <small id="ai-interests-hint">{t("aiPreferencesHint")}</small>
            </label>
            <label>
              {t("aiRequirements")}
              <textarea
                rows={3}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder={t("aiRequirementsPlaceholder")}
                maxLength={600}
              />
            </label>
          </fieldset>
          {error && (
            <p className="ai-error" role="alert">
              {t(error)}
            </p>
          )}
          <button
            type="submit"
            className="button button-primary ai-action"
            disabled={busy}
          >
            <Sparkle size={17} aria-hidden="true" />
            {t(busy ? "aiGenerating" : failed ? "aiRetry" : "aiGenerate")}
          </button>
        </form>
      </section>
      <section
        className="ai-card ai-result-card"
        aria-labelledby="ai-draft-heading"
        aria-busy={busy}
      >
        <h2 id="ai-draft-heading">{t("aiDraft")}</h2>
        {!draft ? (
          <div className="ai-empty">
            <MapTrifold size={42} weight="duotone" aria-hidden="true" />
            <p>{t("aiDraftEmpty")}</p>
          </div>
        ) : (
          <div className="ai-draft">
            <p className="ai-draft-destination">{draft.destination}</p>
            <ol className="ai-days">
              {draft.dailyItinerary.map((day) => (
                <li key={day.day}>
                  <h3>
                    <span>{t("aiDay", { day: day.day })}</span> {day.title}
                  </h3>
                  <ul className="ai-activities">
                    {day.activities.map((activity, index) => (
                      <li key={index}>
                        <Path size={18} aria-hidden="true" />
                        <div>
                          <strong>{activity.name}</strong>
                          <p>{activity.description}</p>
                          {activity.estimatedCost != null && (
                            <small>
                              {t("aiEstimate", {
                                cost: currency.format(activity.estimatedCost),
                              })}
                            </small>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
            {draft.suggestions.length > 0 && (
              <div className="ai-suggestions">
                <h3>{t("aiSuggestions")}</h3>
                <ul>
                  {draft.suggestions.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="ai-disclosure">{t("aiDraftOnly")}</p>
          </div>
        )}
      </section>
      <span className="ai-sr-only" role="status">
        {busy ? t("aiGenerating") : draft && !error ? t("aiDraftReady") : ""}
      </span>
    </div>
  );
}
