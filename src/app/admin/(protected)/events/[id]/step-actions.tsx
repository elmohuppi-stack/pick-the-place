"use client";

import { useState, useEffect, useCallback } from "react";
import {
  majorityWinner,
  topLocation,
  runoffLocationIds,
  type LocationResult,
} from "@/lib/event-status";
import { useInvites } from "./use-invites";
import { EmailTemplateEditor, ResendWarning } from "./email-manager";

interface StepActionsProps {
  eventId: string;
  status: string;
  participantCount: number;
  activeLocationCount: number;
  activeRoundId: string | null;
  activeRoundNumber: number | null;
  proposalEmailText: string | null;
  voteEmailText: string | null;
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

const primaryBtn =
  "px-4 py-2 btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed";
const secondaryBtn =
  "px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const dangerBtn =
  "px-4 py-2 text-sm font-medium rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const linkBtn =
  "text-sm font-medium text-revenexx-600 dark:text-revenexx-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * Aktionsbereich des aktuellen Wizard-Schritts: die phasenabhängige
 * Weiter-Aktion (Einladen/Starten/Beenden/Abschließen), optionaler
 * E-Mail-Text-Editor und – im Ergebnis – der Sieger-Banner.
 */
export function StepActions({
  eventId,
  status,
  participantCount,
  activeLocationCount,
  activeRoundId,
  activeRoundNumber,
  proposalEmailText,
  voteEmailText,
}: StepActionsProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRound, setLastRound] = useState<RoundApi | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const invites = useInvites(eventId, activeRoundNumber);

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

  // Vorschlagsphase starten UND Vorschlags-Einladungen versenden – ein Schritt.
  async function startProposalAndInvite() {
    setBusy(true);
    setError(null);
    try {
      const statusRes = await fetch("/api/events/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status: "proposal" }),
      });
      if (!statusRes.ok) {
        const data = await statusRes.json().catch(() => ({}));
        setError(data.error || "Vorschlagsphase konnte nicht gestartet werden.");
        setBusy(false);
        return;
      }
      await invites.send("proposal");
      window.location.reload();
    } catch {
      setError("Ein Fehler ist aufgetreten");
      setBusy(false);
    }
  }

  // Abstimmung starten (Runde anlegen → Status voting) UND einladen.
  async function startVotingAndInvite() {
    setBusy(true);
    setError(null);
    try {
      const roundRes = await fetch("/api/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!roundRes.ok) {
        const data = await roundRes.json().catch(() => ({}));
        setError(data.error || "Abstimmung konnte nicht gestartet werden.");
        setBusy(false);
        return;
      }
      // Runde ist jetzt aktiv – Vote-Einladung kann versendet werden.
      await invites.send("vote");
      window.location.reload();
    } catch {
      setError("Ein Fehler ist aufgetreten");
      setBusy(false);
    }
  }

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
        await invites.send("vote");
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

  const results = lastRound?.locations ?? [];
  const winner = results.length ? majorityWinner(results) : null;
  const favorite = results.length ? topLocation(results) : null;
  const showBanner =
    (status === "results" || status === "closed") && results.length > 0;

  // E-Mail-Text-Editor: passend zur in dieser Phase relevanten Einladung.
  const editorKind: "proposal" | "vote" =
    status === "voting" ? "vote" : "proposal";
  const editorAvailable =
    status === "setup" || status === "proposal" || status === "voting";

  return (
    <div className="space-y-4">
      {showBanner && (
        <ResultBanner winner={winner} favorite={favorite} results={results} />
      )}

      <div className="bg-theme-card backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-theme-card">
        <p className="text-xs font-semibold uppercase tracking-wider text-revenexx-600 dark:text-revenexx-400 mb-3">
          {status === "voting"
            ? "Laufende Abstimmung"
            : status === "results" || status === "closed"
              ? "Abschluss"
              : "Nächster Schritt"}
        </p>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        {invites.result && (
          <div
            className={`mb-3 p-2.5 rounded-lg text-sm ${
              invites.result.type === "success"
                ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            }`}
          >
            {invites.result.text}
          </div>
        )}

        <Actions
          status={status}
          participantCount={participantCount}
          activeLocationCount={activeLocationCount}
          proposalSent={invites.proposalSent}
          voteSent={invites.voteSent}
          winnerName={winner?.name ?? null}
          busy={busy}
          sending={invites.sending}
          editorAvailable={editorAvailable}
          showEditor={showEditor}
          toggleEditor={() => setShowEditor((v) => !v)}
          setStatus={setStatus}
          endRound={endRound}
          startRunoff={startRunoff}
          startProposalAndInvite={startProposalAndInvite}
          startVotingAndInvite={startVotingAndInvite}
          resendProposal={() => invites.send("proposal")}
          resendVote={() => invites.send("vote")}
        />

        {editorAvailable && showEditor && (
          <EmailTemplateEditor
            eventId={eventId}
            kind={editorKind}
            proposalEmailText={proposalEmailText}
            voteEmailText={voteEmailText}
          />
        )}

        {editorAvailable && <ResendWarning />}
      </div>
    </div>
  );
}

interface ActionsProps {
  status: string;
  participantCount: number;
  activeLocationCount: number;
  proposalSent: number | null;
  voteSent: number | null;
  winnerName: string | null;
  busy: boolean;
  sending: boolean;
  editorAvailable: boolean;
  showEditor: boolean;
  toggleEditor: () => void;
  setStatus: (s: string) => void;
  endRound: () => void;
  startRunoff: () => void;
  startProposalAndInvite: () => void;
  startVotingAndInvite: () => void;
  resendProposal: () => void;
  resendVote: () => void;
}

function Actions(p: ActionsProps) {
  const editorLink = p.editorAvailable && (
    <button onClick={p.toggleEditor} className={linkBtn}>
      {p.showEditor ? "E-Mail-Text ausblenden" : "E-Mail-Text anpassen"}
    </button>
  );

  if (p.status === "setup") {
    return (
      <Block text="Prüfe die Teilnehmer. Wenn alle passen, lade sie ein – damit startet die Vorschlagsphase.">
        <button
          className={primaryBtn}
          disabled={p.busy || p.sending || p.participantCount === 0}
          onClick={p.startProposalAndInvite}
        >
          Einladungen versenden &amp; Vorschlagsphase starten
        </button>
        {editorLink}
        {p.participantCount === 0 && (
          <span className="text-xs text-theme-muted w-full">
            Füge zuerst unten Teilnehmer hinzu.
          </span>
        )}
      </Block>
    );
  }

  if (p.status === "proposal") {
    return (
      <Block
        text={
          p.activeLocationCount === 0
            ? "Teilnehmer schlagen Orte vor. Aktiviere unten die Orte für die Abstimmung."
            : `${p.activeLocationCount} Orte sind aktiv. Starte die Abstimmung, wenn du bereit bist.`
        }
      >
        <button
          className={primaryBtn}
          disabled={p.busy || p.sending || p.activeLocationCount === 0}
          onClick={p.startVotingAndInvite}
        >
          Abstimmung starten &amp; einladen
        </button>
        <button className={linkBtn} disabled={p.sending} onClick={p.resendProposal}>
          {(p.proposalSent ?? 0) > 0
            ? "Vorschlags-Einladung erneut senden"
            : "Vorschlags-Einladung senden"}
        </button>
        {editorLink}
      </Block>
    );
  }

  if (p.status === "voting") {
    return (
      <Block text="Die Abstimmung läuft. Sie endet automatisch, sobald alle abgestimmt haben – oder beende sie manuell.">
        <button className={dangerBtn} disabled={p.busy} onClick={p.endRound}>
          Abstimmung beenden
        </button>
        <button className={linkBtn} disabled={p.sending} onClick={p.resendVote}>
          {(p.voteSent ?? 0) > 0
            ? "Zur Abstimmung erneut einladen"
            : "Zur Abstimmung einladen"}
        </button>
        {editorLink}
      </Block>
    );
  }

  if (p.status === "results") {
    if (p.winnerName) {
      return (
        <Block text="Das Ergebnis steht fest. Schließe das Event ab.">
          <button
            className={primaryBtn}
            disabled={p.busy}
            onClick={() => p.setStatus("closed")}
          >
            Event abschließen
          </button>
        </Block>
      );
    }
    return (
      <Block text="Kein Ort hat über 50 % erreicht. Starte eine Stichwahl zwischen den stärksten Orten – oder schließe das Event ab.">
        <button className={primaryBtn} disabled={p.busy} onClick={p.startRunoff}>
          Stichwahl starten
        </button>
        <button
          className={secondaryBtn}
          disabled={p.busy}
          onClick={() => p.setStatus("closed")}
        >
          Event abschließen
        </button>
      </Block>
    );
  }

  // closed
  return (
    <Block text="Das Event ist abgeschlossen.">
      <button
        className={secondaryBtn}
        disabled={p.busy}
        onClick={() => p.setStatus("results")}
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {children}
      </div>
    </div>
  );
}

/** Prominenter Ergebnis-Banner: Sieger (>50 %) oder Favorit + Balken der Top-Orte. */
function ResultBanner({
  winner,
  favorite,
  results,
}: {
  winner: LocationResult | null;
  favorite: LocationResult | null;
  results: LocationResult[];
}) {
  const highlight = winner ?? favorite;
  if (!highlight) return null;

  const isWinner = winner !== null;
  const sorted = [...results].sort((a, b) => b.voteCount - a.voteCount);
  const topBars = sorted.slice(0, 5);

  return (
    <div
      className={`rounded-2xl p-6 shadow-sm border ${
        isWinner
          ? "border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-revenexx-50 dark:from-blue-900/20 dark:to-revenexx-900/20"
          : "border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10"
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="text-4xl leading-none" aria-hidden>
          {isWinner ? "🏆" : "⭐"}
        </span>
        <div className="min-w-0">
          <p
            className={`text-xs font-semibold uppercase tracking-wider ${
              isWinner
                ? "text-blue-600 dark:text-blue-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {isWinner ? "Sieger" : "Favorit · keine absolute Mehrheit"}
          </p>
          <p className="text-2xl font-bold text-theme-primary truncate">
            {highlight.name}
          </p>
          <p className="text-sm text-theme-secondary">
            {Math.round(highlight.percentage)}% der Stimmen ·{" "}
            {highlight.voteCount}{" "}
            {highlight.voteCount === 1 ? "Stimme" : "Stimmen"}
          </p>
        </div>
      </div>

      {topBars.length > 0 && (
        <div className="mt-5 space-y-2">
          {topBars.map((loc) => {
            const isTop = loc.id === highlight.id;
            return (
              <div key={loc.id} className="flex items-center gap-3 text-sm">
                <span className="w-32 shrink-0 truncate text-theme-secondary">
                  {loc.name}
                </span>
                <div className="flex-1 h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isTop
                        ? isWinner
                          ? "bg-blue-500"
                          : "bg-amber-500"
                        : "bg-slate-400 dark:bg-slate-500"
                    }`}
                    style={{ width: `${Math.max(loc.percentage, 2)}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right tabular-nums text-theme-muted">
                  {Math.round(loc.percentage)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
