export function parseTransactionDate(value: string): Date {
  const parts = value.split("-").map(Number);

  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  }

  return new Date(value);
}

export function toMonthKey(value: string): string {
  const date = parseTransactionDate(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
