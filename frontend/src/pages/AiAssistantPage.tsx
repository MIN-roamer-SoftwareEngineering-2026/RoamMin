import { useState } from "react";
import { ChatCircleDots, Info, MapTrifold } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { AiChatPanel } from "../components/ai/AiChatPanel";
import { ItineraryGenerator } from "../components/ai/ItineraryGenerator";
import "../ai.css";

export function AiAssistantPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"itinerary" | "chat">("itinerary");

  return (
    <main className="page-shell ai-page">
      <header className="page-heading">
        <div>
          <h1>{t("aiAssistant")}</h1>
          <p className="muted">{t("aiIntro")}</p>
        </div>
      </header>
      <p className="ai-notice">
        <Info size={20} aria-hidden="true" />
        {t("aiVerify")}
      </p>
      <div className="ai-mode" role="group" aria-label={t("aiAssistant")}>
        <button
          type="button"
          aria-pressed={mode === "itinerary"}
          aria-controls="ai-itinerary-panel"
          onClick={() => setMode("itinerary")}
        >
          <MapTrifold size={19} aria-hidden="true" /> {t("aiItineraryMode")}
        </button>
        <button
          type="button"
          aria-pressed={mode === "chat"}
          aria-controls="ai-chat-panel"
          onClick={() => setMode("chat")}
        >
          <ChatCircleDots size={19} aria-hidden="true" /> {t("aiChatMode")}
        </button>
      </div>
      <div id="ai-itinerary-panel" hidden={mode !== "itinerary"}>
        <ItineraryGenerator />
      </div>
      <div id="ai-chat-panel" hidden={mode !== "chat"}>
        <AiChatPanel />
      </div>
    </main>
  );
}
