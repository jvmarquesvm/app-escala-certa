import type { AssignmentStatus } from "@shared/schema";

export const STATUS_LABEL: Record<AssignmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  declined: "Recusado",
};

export const STATUS_BADGE_CLASS: Record<AssignmentStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  confirmed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  declined: "bg-destructive/10 text-destructive",
};

const MONTHS_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export function formatDatePt(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS_PT[(m ?? 1) - 1]} ${y}`;
}

export function getDayMonth(iso: string): { day: string; month: string } {
  const [, m, d] = iso.split("-").map(Number);
  return { day: String(d).padStart(2, "0"), month: MONTHS_PT[(m ?? 1) - 1] };
}

export function formatWeekdayPt(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const label = date.toLocaleDateString("pt-BR", { weekday: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function isUpcoming(iso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.getTime() >= today.getTime();
}
