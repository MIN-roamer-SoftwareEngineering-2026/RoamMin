import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import "./TripExpensePanel.css";

const categoryNames = {
  餐饮: "Food",
  交通: "Transport",
  住宿: "Accommodation",
  门票: "Tickets",
  购物: "Shopping",
  其他: "Other",
};

type Category = keyof typeof categoryNames;

type Expense = {
  category: Category;
  cents: number;
  date: string;
};

const categories = Object.keys(categoryNames) as Category[];

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

function readSavedExpenses(storageKey: string): Expense[] {
  try {
    const saved = sessionStorage.getItem(storageKey);
    if (!saved) return [];

    const data: unknown = JSON.parse(saved);
    if (!Array.isArray(data)) return [];

    return data.filter((item): item is Expense =>
      item !== null &&
      typeof item === "object" &&
      typeof item.category === "string" &&
      Object.prototype.hasOwnProperty.call(categoryNames, item.category) &&
      Number.isSafeInteger(item.cents) &&
      item.cents > 0 &&
      typeof item.date === "string"
    );
  } catch {
    return [];
  }
}

export default function TripExpensePanel({
  title,
  storageKey,
}: {
  title: string;
  storageKey: string;
}) {
  const { i18n } = useTranslation();
  const isEnglish = (i18n.resolvedLanguage ?? i18n.language)
    .toLowerCase()
    .startsWith("en");

  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const amountInput = useRef<HTMLInputElement>(null);
  const headingId = useId();

  const [expenses, setExpenses] = useState<Expense[]>(() =>
  readSavedExpenses(storageKey)
);
  const [category, setCategory] = useState<Category>("餐饮");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(localToday);
  const [lastAdded, setLastAdded] = useState<Expense | null>(null);
  const [showAllExpenses, setShowAllExpenses] = useState(false);

  useEffect(() => {
    if (!lastAdded) return;

    const timer = window.setTimeout(() => setLastAdded(null), 3000);
    return () => window.clearTimeout(timer);
  }, [lastAdded]);

  function text(chinese: string, english: string) {
    return isEnglish ? english : chinese;
  }

  function categoryLabel(value: Category) {
    return isEnglish ? categoryNames[value] : value;
  }

  function money(cents: number) {
    return isEnglish ? `CNY ${yuan(cents)}` : `${yuan(cents)} 元`;
  }

  const panelTitle = text("行程费用", "Trip expenses");
  const emptyText = text("暂无费用记录。", "No expenses yet.");
  const total = expenses.reduce((sum, item) => sum + item.cents, 0);

  const sortedExpenses = [...expenses].sort((a, b) => b.cents - a.cents);
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

  function openDialog() {
    const popup = dialog.current;
    const button = trigger.current;
    if (!popup || !button) return;

    setAmount("");
    setExpenseDate(localToday());
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

  function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cents = Math.round(Number(amount) * 100);
    if (!expenseDate || !Number.isSafeInteger(cents) || cents <= 0) return;

    const entry: Expense = { category, cents, date: expenseDate };

    const nextExpenses = [...expenses, entry];

try {
  sessionStorage.setItem(storageKey, JSON.stringify(nextExpenses));
} catch {
  // 浏览器禁用存储时，本次打开的弹窗仍可继续记账。
}

setExpenses(nextExpenses);
    setLastAdded(entry);
    setAmount("");
    amountInput.current?.focus();
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
              {text("：", ": ")}{title}
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

          {expenses.length === 0 ? (
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
                    {visibleExpenses.map((item, index) => (
                      <tr key={index}>
                        <td>{categoryLabel(item.category)}</td>
                        <td>
                          <time dateTime={item.date} title={item.date}>
                            {showAllExpenses ? item.date : item.date.slice(5)}
                          </time>
                        </td>
                        <td className="expense-money">{yuan(item.cents)}</td>
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
              onChange={(event) => setCategory(event.target.value as Category)}
            >
              {categories.map((name) => (
                <option key={name} value={name}>
                  {categoryLabel(name)}
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
              max="99999999.99"
              step="0.01"
              required
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
              value={expenseDate}
              onChange={(event) => setExpenseDate(event.target.value)}
            />
          </label>

          <button type="submit" className="expense-submit">
            {text("记一笔", "Add expense")}
          </button>

          <p className="expense-feedback" role="status" aria-atomic="true">
            {lastAdded && (
              <>
                {text("已添加：", "Added: ")}
                {categoryLabel(lastAdded.category)} · {money(lastAdded.cents)}
              </>
            )}
          </p>
        </form>
      </dialog>

      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: "pointer" }}>
          {text("费用明细", "Expense details")} · {countLabel} ·{" "}
          {text("共 ", "")}{money(total)}
        </summary>

        {expenses.length === 0 ? (
          <p>{emptyText}</p>
        ) : (
          <ol style={{ margin: "8px 0", paddingInlineStart: 24 }}>
            {expenses.map((item, index) => (
              <li key={index}>
                <time dateTime={item.date}>{item.date}</time>
                {" · "}{categoryLabel(item.category)}{" · "}{money(item.cents)}
              </li>
            ))}
          </ol>
        )}
      </details>
    </section>
  );
}