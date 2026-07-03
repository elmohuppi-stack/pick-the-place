"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "ptp.introOpen";

const PHASES = [
  {
    label: "Vorbereitung",
    text: "Für jedes neue Event sind die revenexx-Kollegen bereits als Teilnehmer hinterlegt. Passe die Liste bei Bedarf an – deaktiviere einzelne Personen oder füge neue hinzu. Danach öffnest du die Vorschlagsphase.",
  },
  {
    label: "Vorschläge",
    text: "Jeder Teilnehmer erhält einen persönlichen Link und schlägt Orte vor. Du aktivierst die Orte, die zur Abstimmung stehen sollen.",
  },
  {
    label: "Abstimmung",
    text: "Alle stimmen über ihren persönlichen Link für einen Ort ab. Den Zwischenstand verfolgst du live im Admin-Bereich.",
  },
  {
    label: "Ergebnis",
    text: "Erreicht ein Ort über 50 %, steht der Sieger fest. Andernfalls startest du eine Stichwahl zwischen den stärksten Orten – oder schließt das Event ab.",
  },
];

export function IntroHint() {
  // Erst nach dem Mount rendern, um Hydration-Mismatch mit localStorage zu vermeiden.
  const [ready, setReady] = useState(false);
  // Standardmäßig offen; die gemerkte Wahl überschreibt das nach dem Mount.
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(localStorage.getItem(STORAGE_KEY) !== "0");
    setReady(true);
  }, []);

  if (!ready) return null;

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="bg-theme-card backdrop-blur-sm rounded-2xl shadow-sm border border-theme-card overflow-hidden">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-5 py-4 text-left"
      >
        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-revenexx-100 dark:bg-revenexx-900/30 text-revenexx-600 dark:text-revenexx-400">
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
        </span>
        <span className="flex-1 text-sm font-semibold text-theme-primary">
          So funktioniert Pick the Place
        </span>
        <svg
          className={`w-4 h-4 text-theme-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {open && (
        <ol className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
          {PHASES.map((p, i) => (
            <li key={p.label} className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-revenexx-100 dark:bg-revenexx-900/30 text-revenexx-600 dark:text-revenexx-400 text-xs font-semibold">
                {i + 1}
              </span>
              <span className="text-sm text-theme-secondary leading-relaxed">
                <span className="font-medium text-theme-primary">
                  {p.label}:
                </span>{" "}
                {p.text}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
