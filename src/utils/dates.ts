export function nowIso(): string {
  return new Date().toISOString();
}

export function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

export function toPtBrDate(isoDate: string | null): string {
  if (!isoDate) return "-";
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("pt-BR");
}

export function isEndDateValid(startDate: string | null, endDate: string | null): boolean {
  if (!startDate || !endDate) return true;
  return endDate >= startDate;
}
