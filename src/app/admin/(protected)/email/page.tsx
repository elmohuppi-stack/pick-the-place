"use client";

import { useState, useEffect } from "react";

interface EventSummary {
  id: string;
  title: string;
  status: string;
  _count: { participants: number };
}

export default function EmailPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        if (data.length > 0) setSelectedEventId(data[0].id);
      }
    } catch {
      console.error("Failed to fetch events");
    }
  }

  async function sendEmails(type: "proposal" | "vote") {
    if (!selectedEventId) return;
    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventId, type }),
      });

      const data = await res.json();

      if (res.ok) {
        let text = `${data.sent} von ${data.total} E-Mails erfolgreich versendet.`;
        if (data.failed > 0) {
          text += ` ${data.failed} fehlgeschlagen.`;
          if (data.errors?.length) {
            text += ` Details: ${data.errors.join("; ")}`;
          }
        }
        setResult({
          type: data.failed > 0 ? "error" : "success",
          text,
        });
      } else {
        setResult({
          type: "error",
          text: data.error || "Fehler beim Versenden",
        });
      }
    } catch {
      setResult({ type: "error", text: "Ein Fehler ist aufgetreten" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          E-Mails versenden
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Einladungen an alle Teilnehmer verschicken
        </p>
      </div>

      {/* Event Selection */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Event:
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">Bitte wählen</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title} ({ev._count?.participants || 0} TN)
            </option>
          ))}
        </select>
      </div>

      {result && (
        <div
          className={`p-3 rounded-xl text-sm ${
            result.type === "success"
              ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          }`}
        >
          {result.text}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Proposal Invites */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            Vorschlags-Einladung
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Lade Teilnehmer ein, Orte für das Jahrestreffen vorzuschlagen.
          </p>
          <button
            onClick={() => sendEmails("proposal")}
            disabled={sending || !selectedEventId}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-medium rounded-xl hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {sending ? "Wird gesendet..." : "Einladungen senden"}
          </button>
        </div>

        {/* Vote Invites */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            Abstimmungs-Einladung
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Lade Teilnehmer zur aktuellen Abstimmungsrunde ein.
          </p>
          <button
            onClick={() => sendEmails("vote")}
            disabled={sending || !selectedEventId}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {sending ? "Wird gesendet..." : "Einladungen senden"}
          </button>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Hinweis
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Die E-Mails werden automatisch mit den Magic Links versendet. Jeder
          Teilnehmer erhält einen persönlichen Link, über den er sich
          authentifizieren kann.
          <ResendWarning />
        </p>
      </div>
    </div>
  );
}

function ResendWarning() {
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => setConfigured(data.resendConfigured))
      .catch(() => {});
  }, []);

  if (configured) return null;

  return (
    <span className="block mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg">
      ⚠️ <strong>RESEND_API_KEY</strong> ist nicht konfiguriert. E-Mails werden
      nur simuliert (im Log ausgegeben).
    </span>
  );
}
