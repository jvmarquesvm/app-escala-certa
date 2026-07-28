export type FunctionColorKey = "primary" | "blue" | "gold" | "purple" | "success" | "orange";

export const FUNCTION_COLOR_OPTIONS: { key: FunctionColorKey; label: string }[] = [
  { key: "primary", label: "Terracota" },
  { key: "blue", label: "Azul" },
  { key: "gold", label: "Dourado" },
  { key: "purple", label: "Roxo" },
  { key: "success", label: "Verde" },
  { key: "orange", label: "Laranja" },
];

const MAP: Record<string, { badge: string; dot: string }> = {
  primary: { badge: "bg-primary/10 text-primary", dot: "bg-primary" },
  blue: { badge: "bg-sky-500/10 text-sky-700 dark:text-sky-400", dot: "bg-sky-500" },
  gold: { badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  purple: { badge: "bg-purple-500/10 text-purple-700 dark:text-purple-400", dot: "bg-purple-500" },
  success: { badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  orange: { badge: "bg-orange-500/10 text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
};

export function getFunctionColorClasses(color: string): { badge: string; dot: string } {
  return MAP[color] ?? MAP.primary;
}
