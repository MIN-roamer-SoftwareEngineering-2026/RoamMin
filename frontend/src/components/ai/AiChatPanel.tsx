import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChatCircleDots, PaperPlaneTilt } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { aiApi, aiErrorKey, type ChatMessage } from "../../api/ai";

export function AiChatPanel() {
  const { t, i18n } = useTranslation();
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [failed, setFailed] = useState(false);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [history, busy]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const content = message.trim();
    setFailed(false);
    if (!content) {
      setError("aiQuestionRequired");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const { reply } = await aiApi.chat({
        message: content,
        history: history.slice(-8),
        language: i18n.language === "en" ? "en" : "zh",
      });
      setHistory([
        ...history,
        { role: "user", content },
        { role: "assistant", content: reply },
      ]);
      setMessage("");
    } catch (reason) {
      setError(aiErrorKey(reason));
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    setHistory([]);
    setMessage("");
    setError("");
    setFailed(false);
  }

  return (
    <section className="ai-card ai-chat" aria-labelledby="ai-chat-heading">
      <header className="ai-chat-header">
        <div>
          <h2 id="ai-chat-heading">{t("aiConversation")}</h2>
          <p>{t("aiHistoryHint")}</p>
        </div>
        <button
          type="button"
          className="button button-secondary"
          disabled={busy || (!history.length && !message)}
          onClick={restart}
        >
          {t("aiRestart")}
        </button>
      </header>
      <div
        ref={log}
        className="ai-chat-log"
        role="log"
        aria-labelledby="ai-chat-heading"
        aria-relevant="additions"
        tabIndex={0}
      >
        {!history.length && !busy && (
          <div className="ai-empty">
            <ChatCircleDots size={42} weight="duotone" aria-hidden="true" />
            <p>{t("aiChatEmpty")}</p>
          </div>
        )}
        <ol className="ai-messages">
          {history.map((item, index) => (
            <li
              key={index}
              className={
                item.role === "user"
                  ? "ai-message ai-message-user"
                  : "ai-message"
              }
            >
              <strong>
                {t(item.role === "user" ? "aiYou" : "aiAssistant")}
              </strong>
              <p>{item.content}</p>
            </li>
          ))}
          {busy && (
            <li className="ai-message ai-message-user">
              <strong>{t("aiYou")}</strong>
              <p>{message.trim()}</p>
            </li>
          )}
        </ol>
      </div>
      <form className="ai-form ai-chat-form" onSubmit={send}>
        <p className="ai-chat-status" role="status">
          {busy ? t("aiReplying") : ""}
        </p>
        {error && (
          <p className="ai-error" role="alert">
            {t(error)}
          </p>
        )}
        <label>
          {t("aiQuestion")}
          <textarea
            required
            rows={3}
            value={message}
            maxLength={1200}
            disabled={busy}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("aiQuestionPlaceholder")}
          />
        </label>
        <button
          type="submit"
          className="button button-primary ai-action"
          disabled={busy}
        >
          <PaperPlaneTilt size={17} aria-hidden="true" />
          {t(busy ? "aiReplying" : failed ? "aiRetry" : "aiSend")}
        </button>
      </form>
    </section>
  );
}
