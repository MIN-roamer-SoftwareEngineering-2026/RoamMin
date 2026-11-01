import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MagnifyingGlass, ArrowUpRight } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/auth";
import type { UserSummary } from "../types";
import { UserAvatar } from "./UserAvatar";
export function UserSearch() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSummary[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  useEffect(() => {
    let active = true;
    setResults([]);
    if (query.trim().length < 2) {
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const timer = window.setTimeout(() => {
      void authApi
        .searchUsers(query.trim())
        .then((people) => {
          if (active) {
            setResults(people);
            setStatus("done");
          }
        })
        .catch(() => {
          if (active) setStatus("error");
        });
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);
  return (
    <div className="user-search">
      <label htmlFor="user-search-input">{t("searchUsers")}</label>
      <div className="search-field">
        <MagnifyingGlass size={19} />
        <input
          id="user-search-input"
          autoComplete="off"
          maxLength={50}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchUsername")}
        />
      </div>
      <div aria-live="polite">
        {status === "loading" && <p className="field-hint">{t("searching")}</p>}
        {status === "error" && (
          <p className="form-error">{t("searchFailed")}</p>
        )}
        {status === "done" && !results.length && (
          <p className="field-hint">{t("noUsersFound")}</p>
        )}
        {status === "idle" && (
          <p className="field-hint">{t("searchIdleHint")}</p>
        )}
      </div>
      {!!results.length && (
        <ul className="search-results">
          {results.map((person) => (
            <li key={person.id}>
              <UserAvatar
                name={person.nickname || person.username}
                src={person.avatarUrl}
                size="small"
              />
              <div>
                <strong>{person.nickname || person.username}</strong>
                <small>@{person.username}</small>
              </div>
              <Link className="text-link" to={`/users/${person.id}`}>
                {t("viewProfile")}
                <ArrowUpRight size={15} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
