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

const STATUS_DESCRIPTIONS: Record<string, string> = {
  setup: "Teilnehmer und Rahmen festlegen, bevor es losgeht.",
  proposal: "Teilnehmer schlagen Orte für die Abstimmung vor.",
  voting: "Die Abstimmung läuft – Teilnehmer wählen ihren Ort.",
  results: "Abstimmung beendet – das Ergebnis steht fest.",
  closed: "Das Event ist abgeschlossen.",
};

/** Deutsches Label für einen (englischen) Event-Status. */
export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

/** Kurzer Erklärtext einer Phase (für Tooltips). */
export function statusDescription(status: string): string {
  return STATUS_DESCRIPTIONS[status] ?? "";
}

/** Punkt-Farbe (bg-*) passend zum Status – für Status-Dot/Akzent. */
export function statusDotColor(status: string): string {
  switch (status) {
    case "setup":
      return "bg-slate-400";
    case "proposal":
      return "bg-amber-500";
    case "voting":
      return "bg-green-500";
    case "results":
      return "bg-blue-500";
    default:
      return "bg-revenexx-500";
  }
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

/** Stimmenstärkster Ort (der „Favorit", wenn kein >50 %-Sieger existiert). */
export function topLocation(
  locations: LocationResult[],
): LocationResult | null {
  if (locations.length === 0) return null;
  return [...locations].sort((a, b) => b.voteCount - a.voteCount)[0];
}

interface CountedVote {
  location: { id: string; name: string; description?: string | null } | null;
}

/**
 * Zählt die Stimmen einer Runde aus den tatsächlich abgegebenen Votes
 * (Sentinel `__optout__` = Enthaltung wird ignoriert) und rechnet Prozente.
 * Bewusst aus den Votes abgeleitet – nicht aus aktiven Orten –, damit spätere
 * De-/Aktivierung (z. B. Stichwahl) alte Runden nicht verfälscht.
 */
export function tallyRoundVotes<V extends CountedVote>(
  votes: V[],
): (LocationResult & { description: string | null })[] {
  const realVotes = votes.filter(
    (v) => v.location && v.location.name !== "__optout__",
  );
  const totalVotes = realVotes.length;

  const byLocation = new Map<
    string,
    { id: string; name: string; description: string | null; voteCount: number }
  >();
  for (const vote of realVotes) {
    const loc = vote.location!;
    const entry = byLocation.get(loc.id) ?? {
      id: loc.id,
      name: loc.name,
      description: loc.description ?? null,
      voteCount: 0,
    };
    entry.voteCount += 1;
    byLocation.set(loc.id, entry);
  }

  return Array.from(byLocation.values()).map((loc) => ({
    ...loc,
    percentage: totalVotes > 0 ? (loc.voteCount / totalVotes) * 100 : 0,
  }));
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
