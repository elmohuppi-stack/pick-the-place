"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  EVENT_PHASES,
  majorityWinner,
  runoffLocationIds,
  type LocationResult,
} from "@/lib/event-status";

interface StepperProps {
  eventId: string;
  status: string;
  participantCount: number;
  activeLocationCount: number;
  activeRoundId: string | null;
  roundCount: number;
}

interface LocationApi {
  id: string;
  name: string;
  isActive: boolean;
}

interface RoundApi {
  id: string;
  roundNumber: number;
  status: string;
  locations: LocationResult[];
}

export function PhaseStepper({
  eventId,
  status,
  participantCount,
  activeLocationCount,
  activeRoundId,
  roundCount,
}: StepperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRound, setLastRound] = useState<RoundApi | null>(null);

  const currentIndex = EVENT_PHASES.findIndex((p) => p.status === status);
  const isClosed = status === "closed";

  const loadResults = useCallback(async () => {
    try {
      const res = await fetch(`/api/results?eventId=${eventId}`);
      if (!res.ok) return;
      const data = await res.json();
      const rounds: RoundApi[] = data.rounds || [];
      setLastRound(rounds.length ? rounds[rounds.length - 1] : null);
    } catch {
      /* ignore */
    }
  }, [eventId]);

  useEffect(() => {
    if (status === "results" || status === "closed") loadResults();
  }, [status, loadResults]);

  function goTab(tab: string) {
    router.push(`${pathname}?tab=${tab}`);
  }

  async function run(fn: () => Promise<Response>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Ein Fehler ist aufgetreten");
        setBusy(false);
      }
    } catch {
      setError("Ein Fehler ist aufgetreten");
      setBusy(false);
    }
  }

  const setStatus = (next: string) =>
    run(() =>
      fetch("/api/events/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status: next }),
      }),
    );

  const startRound = () =>
    run(() =>
      fetch("/api/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      }),
    );

  const endRound = () => {
    if (!activeRoundId) return;
    run(() =>
      fetch(`/api/rounds?id=${activeRoundId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      }),
    );
  };

  async function startRunoff() {
    setBusy(true);
    setError(null);
    try {
      const [resR, locR] = await Promise.all([
        fetch(`/api/results?eventId=${eventId}`),
        fetch(`/api/locations?eventId=${eventId}`),
      ]);
      const resData = await resR.json();
      const allLocs: LocationApi[] = await locR.json();
      const rounds: RoundApi[] = resData.rounds || [];
      const last = rounds[rounds.length - 1];
      if (!last || last.locations.length === 0) {
        setError("Keine Ergebnisse für eine Stichwahl vorhanden.");
        setBusy(false);
        return;
      }

      const keepIds = runoffLocationIds(last.locations, 2);

      // Nur die Stichwahl-Orte aktiv lassen (Sentinel __optout__ unangetastet)
      await Promise.all(
        allLocs
          .filter((l) => l.name !== "__optout__")
          .filter((l) => l.isActive !== keepIds.includes(l.id))
          .map((l) =>
            fetch(`/api/locations?id=${l.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isActive: keepIds.includes(l.id) }),
            }),
          ),
      );

      const roundRes = await fetch("/api/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (roundRes.ok) {
        window.location.reload();
      } else {
        const data = await roundRes.json().catch(() => ({}));
        setError(data.error || "Stichwahl konnte nicht gestartet werden.");
        setBusy(false);
      }
    } catch {
      setError("Ein Fehler ist aufgetreten");
      setBusy(false);
    }
  }

  const winner =
    lastRound && lastRound.locations.length
      ? majorityWinner(lastRound.locations)
      : null;

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center">
        {EVENT_PHASES.map((phase, i) => {
          const done = !isClosed && i < currentIndex;
          const active = !isClosed && i === currentIndex;
          const reached = isClosed || i <= currentIndex;
          return (
            <div key={phase.status} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    active
                      ? "bg-revenexx-500 text-white ring-4 ring-revenexx-500/20"
                      : reached
                        ? "bg-revenexx-500 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {done || isClosed ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`mt-1.5 text-xs whitespace-nowrap ${
                    active
                      ? "font-semibold text-revenexx-600 dark:text-revenexx-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {phase.label}
                </span>
              </div>
              {i < EVENT_PHASES.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 mb-5 ${
                    reached && i < currentIndex
                      ? "bg-revenexx-500"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Nächster Schritt */}
      <div className="bg-theme-card backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-theme-card">
        <p className="text-xs font-semibold uppercase tracking-wider text-revenexx-600 dark:text-revenexx-400 mb-2">
          Nächster Schritt
        </p>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <NextStep
          status={status}
          participantCount={participantCount}
          activeLocationCount={activeLocationCount}
          roundCount={roundCount}
          winnerName={winner?.name ?? null}
          winnerPct={winner ? Math.round(winner.percentage) : null}
          busy={busy}
          goTab={goTab}
          setStatus={setStatus}
          startRound={startRound}
          endRound={endRound}
          startRunoff={startRunoff}
        />
      </div>
    </div>
  );
}

interface NextStepProps {
  status: string;
  participantCount: number;
  activeLocationCount: number;
  roundCount: number;
  winnerName: string | null;
  winnerPct: number | null;
  busy: boolean;
  goTab: (tab: string) => void;
  setStatus: (s: string) => void;
  startRound: () => void;
  endRound: () => void;
  startRunoff: () => void;
}

function NextStep(props: NextStepProps) {
  const {
    status,
    participantCount,
    activeLocationCount,
    winnerName,
    winnerPct,
    busy,
    goTab,
    setStatus,
    startRound,
    endRound,
    startRunoff,
  } = props;

  const primary =
    "px-4 py-2 btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed";
  const secondary =
    "px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors";
  const danger =
    "px-4 py-2 text-sm font-medium rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors";

  if (status === "setup") {
    if (participantCount === 0) {
      return (
        <Block text="Füge zuerst Teilnehmer hinzu, um das Event zu starten.">
          <button className={primary} onClick={() => goTab("participants")}>
            Teilnehmer hinzufügen
          </button>
        </Block>
      );
    }
    return (
      <Block text="Alles bereit. Öffne die Vorschlagsphase, damit Teilnehmer Orte einreichen können.">
        <button
          className={primary}
          disabled={busy}
          onClick={() => setStatus("proposal")}
        >
          Vorschlagsphase starten
        </button>
        <button className={secondary} onClick={() => goTab("email")}>
          Einladungen senden
        </button>
      </Block>
    );
  }

  if (status === "proposal") {
    return (
      <Block
        text={
          activeLocationCount === 0
            ? "Teilnehmer schlagen Orte vor. Aktiviere Orte für die Abstimmung, sobald genug Vorschläge da sind."
            : `Teilnehmer schlagen Orte vor. ${activeLocationCount} Orte sind für die Abstimmung aktiv. Starte die Abstimmung, wenn du bereit bist.`
        }
      >
        <button
          className={primary}
          disabled={busy || activeLocationCount === 0}
          onClick={startRound}
        >
          Abstimmung starten
        </button>
        <button className={secondary} onClick={() => goTab("locations")}>
          Orte prüfen
        </button>
        <button className={secondary} onClick={() => goTab("email")}>
          Einladungen senden
        </button>
      </Block>
    );
  }

  if (status === "voting") {
    return (
      <Block text="Die Abstimmung läuft. Sie endet automatisch, wenn alle abgestimmt haben — oder beende sie manuell.">
        <button className={danger} disabled={busy} onClick={endRound}>
          Abstimmung beenden
        </button>
        <button className={secondary} onClick={() => goTab("email")}>
          Zur Abstimmung einladen
        </button>
      </Block>
    );
  }

  if (status === "results") {
    if (winnerName) {
      return (
        <Block
          text={`🏆 Sieger steht fest: ${winnerName} (${winnerPct}% der Stimmen).`}
        >
          <button
            className={primary}
            disabled={busy}
            onClick={() => setStatus("closed")}
          >
            Event abschließen
          </button>
          <button className={secondary} onClick={() => goTab("rounds")}>
            Ergebnis ansehen
          </button>
        </Block>
      );
    }
    return (
      <Block text="Kein Ort hat über 50 % erreicht. Starte eine Stichwahl zwischen den stärksten Orten oder schließe das Event ab.">
        <button className={primary} disabled={busy} onClick={startRunoff}>
          Stichwahl starten
        </button>
        <button
          className={secondary}
          disabled={busy}
          onClick={() => setStatus("closed")}
        >
          Event abschließen
        </button>
        <button className={secondary} onClick={() => goTab("rounds")}>
          Ergebnis ansehen
        </button>
      </Block>
    );
  }

  // closed
  return (
    <Block text="Das Event ist abgeschlossen.">
      <button className={secondary} onClick={() => goTab("rounds")}>
        Ergebnis ansehen
      </button>
      <button
        className={secondary}
        disabled={busy}
        onClick={() => setStatus("results")}
      >
        Wieder öffnen
      </button>
    </Block>
  );
}

function Block({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm text-theme-secondary mb-3">{text}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
