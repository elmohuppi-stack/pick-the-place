"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export function CreateEventForm() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          eventDate: eventDate || undefined,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setTitle("");
        setDescription("");
        setEventDate("");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Fehler beim Erstellen");
      }
    } catch {
      setError("Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 btn btn-primary text-sm"
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
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        Neues Event
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 sm:p-6"
      onClick={() => setShowForm(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg my-8 bg-theme-card rounded-2xl p-6 sm:p-8 shadow-xl border border-theme-card text-left"
      >
        <h3 className="text-lg font-semibold text-theme-primary mb-4">
          Neues Event erstellen
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-1">
            Titel *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-revenexx-500 outline-none text-sm"
            placeholder="z.B. Jahrestreffen 2026"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-1">
            Beschreibung (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-revenexx-500 outline-none text-sm"
            placeholder="Kurze Beschreibung"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-1">
            Termin (optional)
          </label>
          <div className="relative">
            {/* Kalender-Icon links */}
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0V11.25A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
            </span>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              onClick={(e) => {
                // Ganzes Feld öffnet den Picker (nicht nur der Indikator).
                try {
                  e.currentTarget.showPicker?.();
                } catch {
                  /* Browser ohne showPicker: normales Verhalten */
                }
              }}
              className="date-field w-full cursor-pointer pl-11 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-revenexx-500 outline-none text-sm"
            />
            {eventDate && (
              <button
                type="button"
                onClick={() => setEventDate("")}
                aria-label="Termin löschen"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
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
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="px-6 py-2.5 btn btn-primary text-sm disabled:opacity-50"
          >
            {loading ? "Wird erstellt..." : "Erstellen"}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-6 py-2.5 text-sm font-medium text-theme-muted hover:text-theme-primary rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Abbrechen
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}
