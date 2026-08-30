const NBSP = /[\u202f\u00a0]/g;

export function formatDate(value: string, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("es-EC", options)
    .format(new Date(value))
    .replace(NBSP, " ");
}

export function formatDateFull(value: string): string {
  return formatDate(value, { dateStyle: "medium", timeStyle: "short" });
}