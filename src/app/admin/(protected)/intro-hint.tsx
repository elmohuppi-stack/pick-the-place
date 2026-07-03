"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "ptp.introDismissed";

const PHASES = [
  { label: "Vorbereitung", text: "Teilnehmer anlegen & einladen." },
  { label: "Vorschläge", text: "Teilnehmer schlagen Orte vor." },
  { label: "Abstimmung", text: "Alle wählen ihren Ort." },
  { label: "Ergebnis", text: "Sieger steht fest – oder Stichwahl." },
];

export function IntroHint() {
  // Erst nach dem Mount rendern, um Hydration-Mismatch mit localStorage zu vermeiden.
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    setReady(true);
  }, []);

  if (!ready || dismissed) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="relative bg-theme-card backdrop-blur-sm rounded-2xl p-5 pr-10 shadow-sm border border-theme-card">
      <button
        onClick={dismiss}
        aria-label="Hinweis schließen"
        className="absolute top-3 right-3 text-theme-muted hover:text-theme-primary transition-colors"
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
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
      <p className="text-sm font-semibold text-theme-primary mb-3">
        So funktioniert Pick the Place
      </p>
      <ol className="grid gap-3 sm:grid-cols-4">
        {PHASES.map((p, i) => (
          <li key={p.label} className="flex gap-2">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-revenexx-100 dark:bg-revenexx-900/30 text-revenexx-600 dark:text-revenexx-400 text-xs font-semibold">
              {i + 1}
            </span>
            <span className="text-xs text-theme-secondary">
              <span className="font-medium text-theme-primary">{p.label}:</span>{" "}
              {p.text}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
