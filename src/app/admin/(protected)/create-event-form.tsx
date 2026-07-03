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
    <div className="bg-theme-card backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-theme-card">
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
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-revenexx-500 outline-none text-sm"
          />
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
  );
}
