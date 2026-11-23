import { useId, useRef, useState, type FormEvent } from "react";

const categories = ["餐饮", "交通", "住宿", "门票", "购物", "其他"];

type Expense = {
  category: string;
  cents: number;
  date: string;
};

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

export default function TripExpensePanel({ title }: { title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const details = useRef<HTMLDetailsElement>(null);
  const headingId = useId();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [category, setCategory] = useState(categories[0]);
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(localToday);

  const total = expenses.reduce((sum, item) => sum + item.cents, 0);
  const statistics = categories
    .map((name) => {
      const items = expenses.filter((item) => item.category === name);
      return {
        name,
        count: items.length,
        cents: items.reduce((sum, item) => sum + item.cents, 0),
      };
    })
    .filter((row) => row.count > 0);

  function openDialog() {
    const popup = dialog.current;
    const button = trigger.current;
    if (!popup || !button) return;

    setAmount("");
    setExpenseDate(localToday());
    popup.showModal();

    // 优先显示在当前行程按钮上方，并在窗口边缘留出间距。
    const anchor = button.getBoundingClientRect();
    const box = popup.getBoundingClientRect();
    const gap = 12;
    const left = Math.max(
      gap,
      Math.min(anchor.left, window.innerWidth - box.width - gap),
    );
    const top = Math.max(
      gap,
      Math.min(anchor.top - box.height - gap, window.innerHeight - box.height - gap),
    );

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
  }

  function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cents = Math.round(Number(amount) * 100);
    if (!expenseDate || !Number.isSafeInteger(cents) || cents <= 0) return;

    setExpenses((previous) => [
      ...previous,
      { category, cents, date: expenseDate },
    ]);

    if (details.current) details.current.open = true;

    // 连续记账时保留日期和类别，只清空金额。
    setAmount("");
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
        行程费用
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={headingId}
        style={{
          position: "fixed",
          margin: 0,
          width: "min(420px, calc(100vw - 24px))",
          maxHeight: "calc(100dvh - 24px)",
          boxSizing: "border-box",
          overflow: "auto",
          padding: 22,
          border: "1px solid GrayText",
          borderRadius: 18,
          backgroundColor: "Canvas",
          color: "CanvasText",
          boxShadow: "0 16px 50px rgba(0, 0, 0, .28)",
        }}
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
            费用统计
          </h3>
          <button
            type="button"
            className="button button-secondary"
            aria-label="关闭费用统计"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </header>

        <p style={{ margin: "6px 0 16px" }}>{title}</p>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead>
            <tr>
              <th scope="col">类别</th>
              <th scope="col">笔数</th>
              <th scope="col" style={{ textAlign: "right" }}>
                小计（元）
              </th>
            </tr>
          </thead>
          <tbody>
            {statistics.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: "12px 0" }}>
                  还没有费用记录。
                </td>
              </tr>
            )}
            {statistics.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.count}</td>
                <td style={{ textAlign: "right" }}>{yuan(row.cents)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">合计</th>
              <td>{expenses.length}</td>
              <td style={{ textAlign: "right" }}>
                <strong>{yuan(total)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>

        <form
          onSubmit={addExpense}
          style={{ display: "grid", gap: 12, marginTop: 20 }}
        >
          <label style={{ display: "grid", gap: 4 }}>
            费用类别
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            金额（元）
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              max="99999999.99"
              step="0.01"
              required
              placeholder="例如 28.50"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            费用日期
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(event) => setExpenseDate(event.target.value)}
            />
          </label>

          <button type="submit" className="button button-secondary">
            记一笔
          </button>
        </form>
      </dialog>

      <details ref={details} style={{ marginTop: 10 }}>
        <summary style={{ cursor: "pointer" }}>
          费用明细 · {expenses.length} 笔 · 共 {yuan(total)} 元
        </summary>

        {expenses.length === 0 ? (
          <p>还没有费用记录。</p>
        ) : (
          <ol style={{ margin: "8px 0", paddingInlineStart: 24 }}>
            {expenses.map((item, index) => (
              <li key={index}>
                <time dateTime={item.date}>{item.date}</time>
                {" · "}
                {item.category} · {yuan(item.cents)} 元
              </li>
            ))}
          </ol>
        )}
      </details>
    </section>
  );
}