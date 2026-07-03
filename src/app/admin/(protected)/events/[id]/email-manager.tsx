"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Editor für einen Einladungstext. Zeigt je nach `kind` das Vorschlags- oder
 * Abstimmungs-Textfeld. Der eigentliche Versand passiert nicht mehr hier,
 * sondern als Weiter-Aktion im jeweiligen Wizard-Schritt.
 */
export function EmailTemplateEditor({
  eventId,
  kind,
  proposalEmailText,
  voteEmailText,
}: {
  eventId: string;
  kind: "proposal" | "vote";
  proposalEmailText: string | null;
  voteEmailText: string | null;
}) {
  const [proposalText, setProposalText] = useState(proposalEmailText || "");
  const [voteText, setVoteText] = useState(voteEmailText || "");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const value = kind === "proposal" ? proposalText : voteText;
  const setValue = kind === "proposal" ? setProposalText : setVoteText;

  async function save() {
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch("/api/events/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          proposalEmailText: proposalText || null,
          voteEmailText: voteText || null,
        }),
      });
      if (res.ok) {
        setResult({ type: "success", text: "Text gespeichert!" });
      } else {
        const data = await res.json().catch(() => ({}));
        setResult({
          type: "error",
          text: `Fehler: ${data.error || `${res.status} ${res.statusText}`}`,
        });
      }
    } catch (err) {
      setResult({
        type: "error",
        text: `Fehler: ${err instanceof Error ? err.message : "Unbekannt"}`,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-theme-card bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-theme-primary">
          {kind === "proposal" ? "Vorschlags-E-Mail" : "Abstimmungs-E-Mail"}
        </h4>
        <button
          onClick={save}
          disabled={saving}
          className="px-3 py-1.5 btn btn-primary text-sm disabled:opacity-50"
        >
          {saving ? "Speichert…" : "Speichern"}
        </button>
      </div>
      <p className="text-xs text-theme-muted">
        Platzhalter:{" "}
        <code className="text-revenexx-600 dark:text-revenexx-400">
          EVENTNAME
        </code>
        ,{" "}
        <code className="text-revenexx-600 dark:text-revenexx-400">NAME</code>
        {kind === "vote" && (
          <>
            ,{" "}
            <code className="text-revenexx-600 dark:text-revenexx-400">
              ROUND
            </code>
          </>
        )}
        . Leer lassen = Standardtext.
      </p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-revenexx-500 outline-none text-sm resize-none"
        placeholder={
          kind === "proposal"
            ? "Du bist eingeladen, einen Ort für das Event EVENTNAME vorzuschlagen."
            : "Runde ROUND der Ortswahl für EVENTNAME ist gestartet!"
        }
      />
      {result && (
        <p
          className={`text-sm ${
            result.type === "success"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {result.text}
        </p>
      )}
    </div>
  );
}

/** Hinweis, dass ohne RESEND_API_KEY nur simuliert wird. */
export function ResendWarning() {
  const [configured, setConfigured] = useState(true);

  const check = useCallback(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => setConfigured(data.resendConfigured))
      .catch(() => {});
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  if (configured) return null;

  return (
    <p className="mt-3 p-2 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg">
      ⚠️ <strong>RESEND_API_KEY</strong> ist nicht konfiguriert – E-Mails werden
      nur simuliert (im Protokoll sichtbar).
    </p>
  );
}
