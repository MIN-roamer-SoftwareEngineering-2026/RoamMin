import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  createExpense,
  listExpenses,
  yuanToCents,
  type Expense,
  type ExpenseCategory,
} from "../api/expenses";
import "./TripExpensePanel.css";

const categoryNames: Record<ExpenseCategory, [string, string]> = {
  food: ["餐饮", "Food"],
  transport: ["交通", "Transport"],
  lodging: ["住宿", "Accommodation"],
  ticket: ["门票", "Tickets"],
  shopping: ["购物", "Shopping"],
  other: ["其他", "Other"],
};

const categories = Object.keys(categoryNames) as ExpenseCategory[];

function yuan(cents: number) {
  return (cents / 100).toFixed(2);
}

function localToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type TripExpensePanelProps = {
  title: string;
  tripId: number;
};

export default function TripExpensePanel({
  title,
  tripId,
}: TripExpensePanelProps) {
  const { i18n } = useTranslation();
  const isEnglish = (i18n.resolvedLanguage ?? i18n.language)
    .toLowerCase()
    .startsWith("en");

  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const amountInput = useRef<HTMLInputElement>(null);
  const headingId = useId();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(localToday);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<"amount" | "request" | null>(null);
  const [lastAdded, setLastAdded] = useState<Expense | null>(null);
  const [showAllExpenses, setShowAllExpenses] = useState(false);

  // 页面打开、刷新或点击重试时，从后端读取当前行程的记录。
  useEffect(() => {
    let active = true;
    setLoadState("loading");

    async function load() {
      try {
        const rows = await listExpenses(tripId);
        if (active) {
          setExpenses(rows);
          setLoadState("ready");
        }
      } catch {
        if (active) setLoadState("error");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [tripId, loadAttempt]);

  useEffect(() => {
    if (!lastAdded) return;
    const timer = window.setTimeout(() => setLastAdded(null), 3000);
    return () => window.clearTimeout(timer);
  }, [lastAdded]);

  function text(chinese: string, english: string) {
    return isEnglish ? english : chinese;
  }

  function categoryLabel(value: ExpenseCategory) {
    const [chinese, english] = categoryNames[value];
    return text(chinese, english);
  }

  function money(cents: number) {
    return isEnglish ? `CNY ${yuan(cents)}` : `${yuan(cents)} 元`;
  }

  const panelTitle = text("行程费用", "Trip expenses");
  const emptyText = text("暂无费用记录。", "No expenses yet.");
  const total = expenses.reduce((sum, item) => sum + item.amount_cents, 0);

  const sortedExpenses = [...expenses].sort(
    (a, b) => b.amount_cents - a.amount_cents,
  );
  const visibleExpenses = showAllExpenses
    ? sortedExpenses
    : sortedExpenses.slice(0, 3);

  let listTitle = text("支出明细", "Expense details");
  if (expenses.length > 3 && !showAllExpenses) {
    listTitle = text("最高 3 笔支出", "Top 3 expenses");
  } else if (expenses.length > 0) {
    listTitle = text("全部支出", "All expenses");
  }

  const toggleLabel = showAllExpenses
    ? text("收起支出明细", "Collapse expense details")
    : text("展开全部支出", "Show all expenses");

  const countLabel = isEnglish
    ? `${expenses.length} ${expenses.length === 1 ? "entry" : "entries"}`
    : `${expenses.length} 笔`;

  const loadMessage =
    loadState === "error"
      ? text("费用加载失败。", "Could not load expenses.")
      : text("正在加载费用…", "Loading expenses…");

  const loadNotice = (
    <p className="expense-empty" role="status">
      {loadMessage}{" "}
      {loadState === "error" && (
        <button
          type="button"
          onClick={() => setLoadAttempt((previous) => previous + 1)}
        >
          {text("重试", "Retry")}
        </button>
      )}
    </p>
  );

  function openDialog() {
    const popup = dialog.current;
    const button = trigger.current;
    if (!popup || !button) return;

    if (!saving && !saveError) {
      setAmount("");
      setExpenseDate(localToday());
    }

    setShowAllExpenses(false);
    popup.showModal();

    const anchor = button.getBoundingClientRect();
    const box = popup.getBoundingClientRect();
    const gap = 12;

    const left = Math.max(
      gap,
      Math.min(anchor.left, window.innerWidth - box.width - gap),
    );
    const top = Math.max(
      gap,
      Math.min(
        anchor.top - box.height - gap,
        window.innerHeight - box.height - gap,
      ),
    );

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
  }

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || loadState !== "ready") return;

    setSaveError(null);
    setLastAdded(null);

    let cents: number;
    try {
      cents = yuanToCents(amount);
    } catch {
      setSaveError("amount");
      return;
    }

    setSaving(true);
    try {
      const entry = await createExpense(tripId, {
        title: categoryNames[category][0],
        category,
        date: expenseDate,
        amount_cents: cents,
      });

      // 使用后端返回的记录和 ID，保存成功后可以继续录入下一笔。
      setExpenses((previous) => [...previous, entry]);
      setLastAdded(entry);
      setAmount("");
      amountInput.current?.focus();
    } catch {
      setSaveError("request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ marginTop: 10 }}>
      <button
        ref={trigger}
        type="button"
        className="button button-secondary"
        aria-haspopup="dialog"
        onClick={openDialog}
      >
        {panelTitle}
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={headingId}
        className="trip-expense-dialog"
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <h3 id={headingId} style={{ margin: 0 }}>
            {panelTitle}
            <span className="sr-only">
              {text("：", ": ")}
              {title}
            </span>
          </h3>

          <button
            type="button"
            className="expense-close"
            aria-label={text("关闭行程费用", "Close trip expenses")}
            onClick={() => dialog.current?.close()}
          />
        </header>

        <section className="expense-tag expense-tag-summary">
          <h4 className="expense-tag-title">{listTitle}</h4>

          {loadState !== "ready" ? (
            loadNotice
          ) : expenses.length === 0 ? (
            <p className="expense-empty">{emptyText}</p>
          ) : (
            <>
              <div
                className="expense-list-window"
                data-expanded={showAllExpenses}
                tabIndex={showAllExpenses && expenses.length > 5 ? 0 : undefined}
                role="region"
                aria-label={text(
                  "按金额从高到低排列的支出明细",
                  "Expenses sorted by amount, highest first",
                )}
              >
                <table>
                  <thead>
                    <tr>
                      <th scope="col">{text("类别", "Category")}</th>
                      <th scope="col">{text("日期", "Date")}</th>
                      <th scope="col" className="expense-money">
                        {text("金额（元）", "Amount (CNY)")}
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleExpenses.map((item) => (
                      <tr key={item.id}>
                        <td>{categoryLabel(item.category)}</td>
                        <td>
                          <time dateTime={item.date} title={item.date}>
                            {showAllExpenses ? item.date : item.date.slice(5)}
                          </time>
                        </td>
                        <td className="expense-money">
                          {yuan(item.amount_cents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="expense-list-total">
                <span>{text("行程合计", "Trip total")}</span>
                <strong>{money(total)}</strong>
              </div>

              {expenses.length > 3 && (
                <button
                  type="button"
                  className="expense-list-toggle"
                  aria-expanded={showAllExpenses}
                  aria-label={toggleLabel}
                  title={toggleLabel}
                  onClick={() => setShowAllExpenses((previous) => !previous)}
                >
                  <span className="expense-list-chevron" aria-hidden="true" />
                </button>
              )}
            </>
          )}
        </section>

        <form onSubmit={addExpense} className="expense-tag expense-tag-entry">
          <h4 className="expense-tag-title">
            {text("费用录入", "Expense entry")}
          </h4>

          <label className="expense-field expense-field-category">
            {text("费用类别", "Category")}
            <select
              value={category}
              disabled={saving}
              onChange={(event) =>
                setCategory(event.target.value as ExpenseCategory)
              }
            >
              {categories.map((value) => (
                <option key={value} value={value}>
                  {categoryLabel(value)}
                </option>
              ))}
            </select>
          </label>

          <label className="expense-field expense-field-amount">
            {text("金额（元）", "Amount (CNY)")}
            <input
              ref={amountInput}
              type="number"
              inputMode="decimal"
              min="0.01"
              max="21474836.47"
              step="0.01"
              required
              readOnly={saving}
              placeholder={text("例如 28.50", "e.g. 28.50")}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>

          <label className="expense-field expense-field-date">
            {text("费用日期", "Expense date")}
            <input
              type="date"
              required
              readOnly={saving}
              value={expenseDate}
              onChange={(event) => setExpenseDate(event.target.value)}
            />
          </label>

          <button
            type="submit"
            className="expense-submit"
            disabled={saving || loadState !== "ready"}
          >
            {saving
              ? text("正在保存…", "Saving…")
              : text("记一笔", "Add expense")}
          </button>

          <p className="expense-feedback" role="status" aria-atomic="true">
            {saveError === "amount" &&
              text(
                "请输入 0.01 至 21,474,836.47 元的金额，最多两位小数。",
                "Enter an amount from 0.01 to 21,474,836.47 with up to two decimal places.",
              )}
            {saveError === "request" &&
              text(
                "未能确认保存，请刷新核对后再试。",
                "Could not confirm the save. Refresh and check before retrying.",
              )}
            {lastAdded && (
              <>
                {text("已添加：", "Added: ")}
                {categoryLabel(lastAdded.category)} · {money(lastAdded.amount_cents)}
              </>
            )}
          </p>
        </form>
      </dialog>

      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: "pointer" }}>
          {text("费用明细", "Expense details")} ·{" "}
          {loadState === "ready"
            ? `${countLabel} · ${text("共 ", "")}${money(total)}`
            : loadMessage}
        </summary>

        {loadState !== "ready" ? (
          loadNotice
        ) : expenses.length === 0 ? (
          <p>{emptyText}</p>
        ) : (
          <ol style={{ margin: "8px 0", paddingInlineStart: 24 }}>
            {expenses.map((item) => (
              <li key={item.id}>
                <time dateTime={item.date}>{item.date}</time>
                {" · "}{categoryLabel(item.category)}{" · "}{money(item.amount_cents)}
              </li>
            ))}
          </ol>
        )}
      </details>
    </section>
  );
}