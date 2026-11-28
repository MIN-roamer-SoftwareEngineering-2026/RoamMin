import { http, unwrap } from "./http";

export type ExpenseCategory = "transport" | "lodging" | "food" | "ticket" | "shopping" | "other";

export interface NewExpense {
  title: string;
  amount_cents: number;
  category: ExpenseCategory;
  date: string;
  note?: string;
}

export interface Expense extends NewExpense {
  id: number;
}

export function yuanToCents(input: string): number {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(input.trim());
  if (!match) throw new Error("请输入正数金额，最多两位小数");
  const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 2147483647) {
    throw new Error("金额须在 0.01 至 21,474,836.47 元之间");
  }
  return cents;
}

function expensesPath(tripId: number): string {
  if (!Number.isSafeInteger(tripId) || tripId <= 0) throw new Error("行程 ID 无效");
  return `/trips/${tripId}/expenses`;
}

export async function listExpenses(tripId: number): Promise<Expense[]> {
  const expenses = await unwrap<Expense[]>(http.get(expensesPath(tripId)));
  if (!Array.isArray(expenses)) throw new Error("费用列表响应格式不正确");
  return expenses;
}

export async function createExpense(tripId: number, expense: NewExpense): Promise<Expense> {
  if (!Number.isInteger(expense.amount_cents) || expense.amount_cents <= 0 ||
      expense.amount_cents > 2147483647) {
    throw new Error("费用金额必须是有效的整数分");
  }
  return unwrap<Expense>(http.post(expensesPath(tripId), expense));
}
