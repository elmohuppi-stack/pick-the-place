"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";

interface Participant {
  id: string;
  eventId: string;
  name: string;
  email: string;
  authToken: string;
  createdAt: string;
}

export function ParticipantManager({ eventId }: { eventId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddForms, setShowAddForms] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch(`/api/participants?eventId=${eventId}`);
      if (res.ok) setParticipants(await res.json());
    } catch {
      console.error("Failed to fetch participants");
    }
  }, [eventId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  async function addParticipant(e: FormEvent) {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, name, email }),
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
    if (!bulkInput.trim()) return;

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
            body: JSON.stringify({ eventId, name: pName, email: pEmail }),
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
    <div className="space-y-4">
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

      <div className="bg-theme-card backdrop-blur-sm rounded-2xl shadow-sm border border-theme-card overflow-hidden">
        <div className="px-6 py-4 border-b border-theme-card flex items-center justify-between">
          <h2 className="text-lg font-semibold text-theme-primary">
            Teilnehmer ({participants.length})
          </h2>
          <button
            onClick={() => setShowAddForms(!showAddForms)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-revenexx-600 dark:text-revenexx-400 hover:bg-revenexx-50 dark:hover:bg-revenexx-900/30 rounded-lg transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showAddForms ? "rotate-45" : ""}`}
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
            Hinzufügen
          </button>
        </div>

        {showAddForms && (
          <div className="px-6 py-5 border-b border-theme-card space-y-6 bg-slate-50/50 dark:bg-slate-900/30">
            <div>
              <h3 className="text-sm font-semibold text-theme-primary mb-3">
                Einzelnen Teilnehmer hinzufügen
              </h3>
              <form
                onSubmit={addParticipant}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-revenexx-500 outline-none text-sm"
                  placeholder="Name"
                  required
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-revenexx-500 outline-none text-sm"
                  placeholder="E-Mail"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 btn btn-primary text-sm disabled:opacity-50 shrink-0"
                >
                  Hinzufügen
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-theme-primary mb-3">
                Mehrere Teilnehmer importieren
              </h3>
              <p className="text-xs text-theme-muted mb-2">
                Eine Zeile pro Person:{" "}
                <code className="text-revenexx-600 dark:text-revenexx-400">
                  Name, email@example.com
                </code>
              </p>
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-revenexx-500 outline-none text-sm resize-none"
                rows={4}
                placeholder="Max Mustermann, max@example.com&#10;Erika Musterfrau, erika@example.com"
              />
              <button
                onClick={addBulkParticipants}
                disabled={loading || !bulkInput.trim()}
                className="mt-2 px-6 py-2.5 btn btn-primary text-sm disabled:opacity-50"
              >
                Importieren
              </button>
            </div>
          </div>
        )}

        {participants.length === 0 ? (
          <div className="p-8 text-center text-theme-muted text-sm">
            {showAddForms
              ? "Füge oben Teilnehmer hinzu."
              : "Noch keine Teilnehmer. Klicke auf »Hinzufügen«, um welche einzuladen."}
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-theme-primary truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-theme-muted truncate">{p.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    onClick={() => copyLink(p.authToken)}
                    className="px-3 py-1.5 text-xs font-medium text-revenexx-600 dark:text-revenexx-400 hover:bg-revenexx-50 dark:hover:bg-revenexx-900/30 rounded-lg transition-colors"
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
    </div>
  );
}
