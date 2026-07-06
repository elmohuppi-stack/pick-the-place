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
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface StepActionsProps {
  eventId: string;
  eventTitle: string;
  status: string;
  participantCount: number;
  activeParticipantCount: number;
  activeLocationCount: number;
  activeRoundId: string | null;
  activeRoundNumber: number | null;
  /** Rundennummer für die Abstimmungs-E-Mail-Vorschau (aktive bzw. nächste Runde). */
  voteRoundNumber: number;
  proposalEmailText: string | null;
  voteEmailText: string | null;
  /** Unterschritt der Einladungs-Phasen: 0 = Auswahl, 1 = E-Mail. */
  inviteStep: 0 | 1;
  setInviteStep: (step: 0 | 1) => void;
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
  eventTitle,
  status,
  participantCount,
  activeParticipantCount,
  activeLocationCount,
  activeRoundId,
  activeRoundNumber,
  voteRoundNumber,
  proposalEmailText,
  voteEmailText,
  inviteStep,
  setInviteStep,
}: StepActionsProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRound, setLastRound] = useState<RoundApi | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  // Offener Bestätigungs-Dialog fürs erneute Versenden von Einladungen.
  const [confirmResend, setConfirmResend] = useState<"proposal" | "vote" | null>(
    null,
  );
  // E-Mail-Texte leben hier und werden beim Versand persistiert (kein Speichern-Button).
  const [proposalText, setProposalText] = useState(proposalEmailText || "");
  const [voteText, setVoteText] = useState(voteEmailText || "");
  const invites = useInvites(eventId, activeRoundNumber);

  // Persistiert einen Einladungstext (leer = null = Standardtext). Gibt Erfolg zurück.
  const saveTemplate = useCallback(
    async (field: "proposalEmailText" | "voteEmailText", text: string) => {
      const res = await fetch("/api/events/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, [field]: text.trim() || null }),
      });
      return res.ok;
    },
    [eventId],
  );

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
  // Der (evtl. angepasste) E-Mail-Text wird zuvor persistiert.
  async function startProposalAndInvite() {
    setBusy(true);
    setError(null);
    try {
      if (!(await saveTemplate("proposalEmailText", proposalText))) {
        setError("E-Mail-Text konnte nicht gespeichert werden.");
        setBusy(false);
        return;
      }
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
  // Der (evtl. angepasste) Abstimmungs-Text wird zuvor persistiert.
  async function startVotingAndInvite() {
    setBusy(true);
    setError(null);
    try {
      if (!(await saveTemplate("voteEmailText", voteText))) {
        setError("E-Mail-Text konnte nicht gespeichert werden.");
        setBusy(false);
        return;
      }
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

  const editorAvailable =
    status === "setup" || status === "proposal" || status === "voting";

  // Resend persistiert vorher den aktuellen Text (kein Speichern-Button).
  // Ausgelöst wird er erst nach Bestätigung im Dialog.
  const runResend = async () => {
    if (confirmResend === "proposal") {
      await saveTemplate("proposalEmailText", proposalText);
      await invites.send("proposal");
    } else if (confirmResend === "vote") {
      await saveTemplate("voteEmailText", voteText);
      await invites.send("vote");
    }
    setConfirmResend(null);
  };

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
          eventTitle={eventTitle}
          voteRoundNumber={voteRoundNumber}
          participantCount={participantCount}
          activeParticipantCount={activeParticipantCount}
          activeLocationCount={activeLocationCount}
          proposalSent={invites.proposalSent}
          voteSent={invites.voteSent}
          winnerName={winner?.name ?? null}
          busy={busy}
          sending={invites.sending}
          inviteStep={inviteStep}
          goToInvite={() => setInviteStep(1)}
          backToSelection={() => setInviteStep(0)}
          proposalText={proposalText}
          setProposalText={setProposalText}
          voteText={voteText}
          setVoteText={setVoteText}
          showEditor={showEditor}
          toggleEditor={() => setShowEditor((v) => !v)}
          setStatus={setStatus}
          endRound={endRound}
          startRunoff={startRunoff}
          startProposalAndInvite={startProposalAndInvite}
          startVotingAndInvite={startVotingAndInvite}
          resendProposal={() => setConfirmResend("proposal")}
          resendVote={() => setConfirmResend("vote")}
        />

        {status === "voting" && showEditor && (
          <EmailTemplateEditor
            kind="vote"
            value={voteText}
            onChange={setVoteText}
            eventTitle={eventTitle}
            roundNumber={voteRoundNumber}
          />
        )}

        {editorAvailable && <ResendWarning />}
      </div>

      <ConfirmDialog
        open={confirmResend !== null}
        title={
          confirmResend === "vote"
            ? "Zur Abstimmung erneut einladen?"
            : "Vorschlags-Einladung erneut senden?"
        }
        message={
          confirmResend === "vote"
            ? "Alle aktiven Teilnehmer erhalten die Einladung zur Abstimmung noch einmal per E-Mail. Möchtest du fortfahren?"
            : "Alle aktiven Teilnehmer erhalten die Einladung zum Ortsvorschlag noch einmal per E-Mail. Möchtest du fortfahren?"
        }
        confirmLabel="Ja, erneut senden"
        busy={invites.sending}
        onConfirm={runResend}
        onCancel={() => setConfirmResend(null)}
      />
    </div>
  );
}

interface ActionsProps {
  status: string;
  eventTitle: string;
  voteRoundNumber: number;
  participantCount: number;
  activeParticipantCount: number;
  activeLocationCount: number;
  proposalSent: number | null;
  voteSent: number | null;
  winnerName: string | null;
  busy: boolean;
  sending: boolean;
  inviteStep: 0 | 1;
  goToInvite: () => void;
  backToSelection: () => void;
  proposalText: string;
  setProposalText: (v: string) => void;
  voteText: string;
  setVoteText: (v: string) => void;
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
  if (p.status === "setup") {
    // Unterschritt 0: Teilnehmer bestimmen.
    if (p.inviteStep === 0) {
      return (
        <Block text="Bestimme die Teilnehmer für die Vorschlagsphase. Prüfe die Liste unten – deaktiviere einzelne Personen oder füge weitere hinzu. Danach lädst du sie zur Vorschlagsphase ein.">
          <button
            className={primaryBtn}
            disabled={p.busy || p.sending || p.activeParticipantCount === 0}
            onClick={p.goToInvite}
          >
            Weiter zum Einladungstext
          </button>
          {p.activeParticipantCount === 0 && (
            <span className="text-xs text-theme-muted w-full">
              Aktiviere oder füge unten mindestens einen Teilnehmer hinzu.
            </span>
          )}
        </Block>
      );
    }
    // Unterschritt 1: Einladungstext & Versand.
    return (
      <InviteStep
        summary={
          <>
            <span className="font-medium text-theme-primary">
              {p.activeParticipantCount}
            </span>{" "}
            {p.activeParticipantCount === 1 ? "Teilnehmer" : "Teilnehmer"} erhalten
            die Einladung, Orte vorzuschlagen.
          </>
        }
        onBack={p.backToSelection}
        backLabel="Teilnehmer ändern"
        editor={
          <EmailTemplateEditor
            kind="proposal"
            value={p.proposalText}
            onChange={p.setProposalText}
            eventTitle={p.eventTitle}
          />
        }
        sendLabel="E-Mail für Vorschläge versenden"
        sendHint="Mit dem Versand startet die Vorschlagsphase."
        onSend={p.startProposalAndInvite}
        disabled={p.busy || p.sending}
      />
    );
  }

  if (p.status === "proposal") {
    // Unterschritt 0: Orte für die Abstimmung aktivieren.
    if (p.inviteStep === 0) {
      return (
        <Block
          text={
            p.activeLocationCount === 0
              ? "Deine Kollegen schlagen jetzt Orte vor. Aktiviere unten die Orte, über die abgestimmt werden soll."
              : `${p.activeLocationCount} Orte sind für die Abstimmung aktiviert. Wenn du bereit bist, lädst du zur Abstimmung ein.`
          }
        >
          <button
            className={primaryBtn}
            disabled={p.busy || p.sending || p.activeLocationCount === 0}
            onClick={p.goToInvite}
          >
            Weiter zum Einladungstext
          </button>
          <button className={linkBtn} disabled={p.sending} onClick={p.resendProposal}>
            {(p.proposalSent ?? 0) > 0
              ? "Vorschlags-Einladung erneut senden"
              : "Vorschlags-Einladung senden"}
          </button>
        </Block>
      );
    }
    // Unterschritt 1: Abstimmungs-Einladung & Versand.
    return (
      <InviteStep
        summary={
          <>
            <span className="font-medium text-theme-primary">
              {p.activeLocationCount}
            </span>{" "}
            Orte stehen zur Abstimmung.
          </>
        }
        onBack={p.backToSelection}
        backLabel="Orte ändern"
        editor={
          <EmailTemplateEditor
            kind="vote"
            value={p.voteText}
            onChange={p.setVoteText}
            eventTitle={p.eventTitle}
            roundNumber={p.voteRoundNumber}
          />
        }
        sendLabel="E-Mail für Abstimmung versenden"
        sendHint="Mit dem Versand startet die Abstimmung."
        onSend={p.startVotingAndInvite}
        disabled={p.busy || p.sending}
      />
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
        <button onClick={p.toggleEditor} className={linkBtn}>
          {p.showEditor ? "E-Mail-Text ausblenden" : "E-Mail-Text anpassen"}
        </button>
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

/**
 * Zweiter Unterschritt der Einladungs-Phasen: Zusammenfassung der Auswahl
 * (mit Zurück-Link), sichtbarer Einladungstext und der finale Versand-Button.
 */
function InviteStep({
  summary,
  onBack,
  backLabel,
  editor,
  sendLabel,
  sendHint,
  onSend,
  disabled,
}: {
  summary: React.ReactNode;
  onBack: () => void;
  backLabel: string;
  editor: React.ReactNode;
  sendLabel: string;
  sendHint: string;
  onSend: () => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-theme-secondary">{summary}</p>
        <button onClick={onBack} className={linkBtn}>
          {backLabel}
        </button>
      </div>
      <p className="text-sm text-theme-secondary">
        Passe bei Bedarf den Einladungstext an – oder lass ihn leer für den
        Standardtext.
      </p>
      {editor}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <button className={primaryBtn} disabled={disabled} onClick={onSend}>
          {sendLabel}
        </button>
        <span className="text-xs text-theme-muted">{sendHint}</span>
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
