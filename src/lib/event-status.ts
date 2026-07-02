export type EventStatus =
  | "setup"
  | "proposal"
  | "voting"
  | "results"
  | "closed";

/** Reihenfolge der sichtbaren Phasen im Stepper. `closed` ist Endzustand nach `results`. */
export const EVENT_PHASES: { status: EventStatus; label: string }[] = [
  { status: "setup", label: "Vorbereitung" },
  { status: "proposal", label: "Vorschläge" },
  { status: "voting", label: "Abstimmung" },
  { status: "results", label: "Ergebnis" },
];

const STATUS_LABELS: Record<string, string> = {
  setup: "Vorbereitung",
  proposal: "Vorschläge",
  voting: "Abstimmung",
  results: "Ergebnis",
  closed: "Abgeschlossen",
};

/** Deutsches Label für einen (englischen) Event-Status. */
export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

/** Farb-Klassen für ein Status-Badge (light + dark). */
export function statusBadgeClasses(status: string): string {
  switch (status) {
    case "setup":
      return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
    case "proposal":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "voting":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "results":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    default:
      return "bg-revenexx-100 text-revenexx-700 dark:bg-revenexx-900/30 dark:text-revenexx-400";
  }
}

export interface LocationResult {
  id: string;
  name: string;
  voteCount: number;
  percentage: number;
}

/** Ort mit absoluter Mehrheit (>50 %) in der Runde, sonst null. */
export function majorityWinner(
  locations: LocationResult[],
): LocationResult | null {
  return locations.find((l) => l.percentage > 50) ?? null;
}

/**
 * Orte für eine Stichwahl: die `topN` stimmenstärksten, plus alle,
 * die mit dem letzten Platz gleichauf liegen (Gleichstand mitnehmen).
 * Gibt die zu aktivierenden Location-IDs zurück.
 */
export function runoffLocationIds(
  locations: LocationResult[],
  topN = 2,
): string[] {
  const sorted = [...locations].sort((a, b) => b.voteCount - a.voteCount);
  if (sorted.length <= topN) return sorted.map((l) => l.id);
  const cutoff = sorted[topN - 1].voteCount;
  return sorted.filter((l) => l.voteCount >= cutoff).map((l) => l.id);
}
