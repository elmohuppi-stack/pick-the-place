"use client";

import { useState, useEffect, FormEvent } from "react";

interface Participant {
  id: string;
  eventId: string;
  name: string;
  email: string;
  authToken: string;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  status: string;
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchParticipants();
    }
  }, [selectedEventId]);

  async function fetchEvents() {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        if (data.length > 0 && !selectedEventId) {
          setSelectedEventId(data[0].id);
        }
      }
    } catch {
      console.error("Failed to fetch events");
    }
  }

  async function fetchParticipants() {
    try {
      const res = await fetch(`/api/participants?eventId=${selectedEventId}`);
      if (res.ok) {
        setParticipants(await res.json());
      }
    } catch {
      console.error("Failed to fetch participants");
    }
  }

  async function addParticipant(e: FormEvent) {
    e.preventDefault();
    if (!name || !email || !selectedEventId) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventId, name, email }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Teilnehmer hinzugefügt!" });
        setName("");
        setEmail("");
        fetchParticipants();
      } else {
        const data = await res.json();
        setMessage({
          type: "error",
          text: data.error || "Fehler beim Hinzufügen",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Ein Fehler ist aufgetreten" });
    } finally {
      setLoading(false);
    }
  }

  async function addBulkParticipants() {
    if (!bulkInput.trim() || !selectedEventId) return;

    setLoading(true);
    setMessage(null);

    const lines = bulkInput.trim().split("\n");
    let added = 0;
    let errors = 0;

    for (const line of lines) {
      const parts = line.split(",").map((s) => s.trim());
      if (parts.length >= 2) {
        const [pName, pEmail] = parts;
        try {
          const res = await fetch("/api/participants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventId: selectedEventId,
              name: pName,
              email: pEmail,
            }),
          });
          if (res.ok) added++;
          else errors++;
        } catch {
          errors++;
        }
      }
    }

    setMessage({
      type: added > 0 ? "success" : "error",
      text: `${added} Teilnehmer hinzugefügt, ${errors} Fehler`,
    });
    setBulkInput("");
    fetchParticipants();
    setLoading(false);
  }

  async function removeParticipant(id: string) {
    if (!confirm("Teilnehmer wirklich entfernen?")) return;

    try {
      await fetch(`/api/participants?id=${id}`, { method: "DELETE" });
      fetchParticipants();
    } catch {
      setMessage({ type: "error", text: "Fehler beim Entfernen" });
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/propose?token=${token}`;
    navigator.clipboard.writeText(url);
    setMessage({ type: "success", text: "Link kopiert!" });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Teilnehmer
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Teilnehmer verwalten
        </p>
      </div>

      {/* Event Selector */}
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
              {ev.title} ({ev.status})
            </option>
          ))}
        </select>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-sm ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {!selectedEventId && (
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-slate-200/60 dark:border-slate-700/60 text-center text-slate-500 dark:text-slate-400">
          Bitte wähle zuerst ein Event aus.
        </div>
      )}

      {selectedEventId && (
        <>
          {/* Add Single Participant */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Teilnehmer hinzufügen
            </h2>
            <form
              onSubmit={addParticipant}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="Name"
                required
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="E-Mail"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all"
              >
                Hinzufügen
              </button>
            </form>
          </div>

          {/* Bulk Import */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Mehrere Teilnehmer importieren
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Eine Zeile pro Person:{" "}
              <code className="text-indigo-600 dark:text-indigo-400">
                Name, email@example.com
              </code>
            </p>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
              rows={5}
              placeholder="Max Mustermann, max@example.com&#10;Erika Musterfrau, erika@example.com"
            />
            <button
              onClick={addBulkParticipants}
              disabled={loading || !bulkInput.trim()}
              className="mt-3 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              Importieren
            </button>
          </div>

          {/* Participant List */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Teilnehmer ({participants.length})
              </h2>
            </div>
            {participants.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                Noch keine Teilnehmer.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-6 py-3.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {p.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyLink(p.authToken)}
                        className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                      >
                        Link kopieren
                      </button>
                      <button
                        onClick={() => removeParticipant(p.id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        Entfernen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
