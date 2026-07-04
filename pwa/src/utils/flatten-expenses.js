export function flattenExpenses(raw) {
  if (!raw || typeof raw !== 'object') return [];

  return Object.entries(raw)
    .flatMap(([date, entries]) =>
      (Array.isArray(entries) ? entries : []).map((entry) => ({
        ...entry,
        date,
      })),
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function groupExpensesByDay(expenses) {
  const groups = new Map();
  for (const expense of expenses) {
    const key = expense.date;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(expense);
  }
  return groups;
}

export function topCategories(byCategory, limit = 3) {
  if (!byCategory) return [];
  return Object.entries(byCategory)
    .sort(([, a], [, b]) => b.amount - a.amount)
    .slice(0, limit)
    .map(([name, summary]) => ({ name, ...summary }));
}
