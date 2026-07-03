import type { ExpenseEntry } from '../types';
import { AppError } from '../util/errors';
import { makeExpenseId } from '../gitlab/paths';

export interface AddExpenseInput {
  timestamp: string;
  category: string;
  subcategory: string;
  amount: number;
  message?: string;
}

export function validateAddExpenseInput(body: unknown): AddExpenseInput {
  if (!body || typeof body !== 'object') {
    throw new AppError('Request body must be a JSON object');
  }

  const data = body as Record<string, unknown>;
  const timestamp = data.timestamp;
  const category = data.category;
  const subcategory = data.subcategory;
  const amount = data.amount;
  const message = data.message;

  if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) {
    throw new AppError('timestamp must be a valid ISO-8601 string');
  }
  if (typeof category !== 'string' || !category.trim()) {
    throw new AppError('category is required');
  }
  if (typeof subcategory !== 'string' || !subcategory.trim()) {
    throw new AppError('subcategory is required');
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new AppError('amount must be a positive number');
  }
  if (message !== undefined && typeof message !== 'string') {
    throw new AppError('message must be a string');
  }

  return {
    timestamp,
    category: category.trim(),
    subcategory: subcategory.trim(),
    amount,
    message: typeof message === 'string' ? message : undefined,
  };
}

export function buildExpenseEntry(input: AddExpenseInput): ExpenseEntry {
  return {
    id: makeExpenseId(input.timestamp),
    timestamp: input.timestamp,
    category: input.category,
    subcategory: input.subcategory,
    amount: input.amount,
    ...(input.message ? { message: input.message } : {}),
  };
}

export function appendExpense(
  existing: ExpenseEntry[] | null,
  entry: ExpenseEntry,
): ExpenseEntry[] {
  return [...(existing ?? []), entry];
}
