"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DEFAULT_PROPOSAL_TEXT,
  DEFAULT_VOTE_TEXT,
  fillPreview,
} from "@/lib/email-templates";

/**
 * Editor für einen Einladungstext. Zeigt je nach `kind` das Vorschlags- oder
 * Abstimmungs-Textfeld. Kontrollierte Komponente: der Text lebt im Aufrufer
 * (step-actions) und wird dort beim Versand persistiert – kein Speichern-Button.
 * Leer lassen = Standardtext wird verwendet; in der Vorschau sind EVENTNAME und
 * ROUND bereits durch die konkreten Werte ersetzt.
 */
export function EmailTemplateEditor({
  kind,
  value,
  onChange,
  eventTitle,
  roundNumber,
}: {
  kind: "proposal" | "vote";
  value: string;
  onChange: (value: string) => void;
  eventTitle: string;
  roundNumber?: number;
}) {
  const suggestion = fillPreview(
    kind === "proposal" ? DEFAULT_PROPOSAL_TEXT : DEFAULT_VOTE_TEXT,
    eventTitle,
    kind === "vote" ? roundNumber : undefined,
  );
  return (
    <div className="mt-3 rounded-xl border border-theme-card bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-theme-primary">
        {kind === "proposal" ? "Vorschlags-E-Mail" : "Abstimmungs-E-Mail"}
      </h4>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-revenexx-500 outline-none text-sm resize-none"
        placeholder={suggestion}
      />
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
