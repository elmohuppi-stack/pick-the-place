"use client";

import { useState } from "react";

const PHASES = [
  {
    label: "1 · Vorbereitung",
    text: "Für jedes neue Event sind die revenexx-Kollegen automatisch als Teilnehmer hinterlegt. Prüfe die Liste – deaktiviere einzelne Personen oder füge weitere hinzu. Optional kannst du einen Termin und eine Beschreibung setzen.",
  },
  {
    label: "2 · Einladen & Vorschläge",
    text: "Mit „Einladungen versenden & Vorschlagsphase starten“ bekommt jeder Teilnehmer einen persönlichen Magic Link und reicht darüber Ortsvorschläge ein. Du aktivierst die Orte, die zur Abstimmung stehen sollen. Den Einladungstext kannst du vorher anpassen.",
  },
  {
    label: "3 · Abstimmung",
    text: "„Abstimmung starten & einladen“ öffnet die Runde und lädt alle zur Abstimmung ein. Jeder wählt über seinen Link genau einen Ort – oder enthält sich. Teilnahme-Fortschritt und Zwischenstand siehst du live.",
  },
  {
    label: "4 · Ergebnis",
    text: "Erreicht ein Ort über 50 %, steht der Sieger fest. Andernfalls startest du eine Stichwahl zwischen den stärksten Orten. Zum Schluss schließt du das Event ab – der gesamte Ablauf bleibt im Protokoll nachvollziehbar.",
  },
];

export function IntroHint() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span className="relative inline-flex group">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="So funktioniert Pick the Place"
          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-revenexx-100 dark:bg-revenexx-900/30 text-revenexx-600 dark:text-revenexx-400 hover:bg-revenexx-200 dark:hover:bg-revenexx-900/50 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
        </button>
        {/* Tooltip beim Hover/Fokus */}
        <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 dark:bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          So funktioniert Pick the Place
        </span>
      </span>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl my-8 bg-theme-card rounded-2xl p-6 sm:p-8 shadow-xl border border-theme-card text-left"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-revenexx-100 dark:bg-revenexx-900/30 text-revenexx-600 dark:text-revenexx-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                    />
                  </svg>
                </span>
                <h3 className="text-lg font-semibold text-theme-primary">
                  So funktioniert Pick the Place
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Schließen"
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-sm text-theme-secondary leading-relaxed mb-5">
              Pick the Place führt euch in vier Phasen zum gemeinsamen Ort. Ein
              Assistent im Event zeigt dir immer den nächsten Schritt und die
              passende Aktion; abgeschlossene Schritte kannst du jederzeit wieder
              ansehen.
            </p>

            <ol className="space-y-4">
              {PHASES.map((p) => (
                <li key={p.label} className="flex gap-3">
                  <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-revenexx-500" />
                  <div>
                    <p className="text-sm font-semibold text-theme-primary">
                      {p.label}
                    </p>
                    <p className="text-sm text-theme-secondary leading-relaxed">
                      {p.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
