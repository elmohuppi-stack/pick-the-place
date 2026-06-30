"use client";

import { useState } from "react";

interface EventData {
  id: string;
  title: string;
  status: string;
  votingRounds: VotingRoundData[];
  locations: LocationData[];
  participants: { id: string; name: string; email: string }[];
}

interface VotingRoundData {
  id: string;
  roundNumber: number;
  status: string;
  startsAt: string | Date | null;
  endsAt: string | Date | null;
}

interface LocationData {
  id: string;
  name: string;
  description: string | null;
  proposedBy: { name: string };
}

export function RoundManager({ event }: { event: EventData }) {
  const [eventStatus, setEventStatus] = useState(event.status);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function updateEventStatus(status: string) {
    try {
      const res = await fetch("/api/events/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, status }),
      });
      if (res.ok) {
        setEventStatus(status);
        setMessage({ type: "success", text: `Status auf '${status}' gesetzt` });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Fehler" });
      }
    } catch {
      setMessage({ type: "error", text: "Ein Fehler ist aufgetreten" });
    }
  }

  async function startNewRound() {
    if (event.locations.length === 0) {
      setMessage({ type: "error", text: "Keine aktiven Orte für diese Runde" });
      return;
    }

    try {
      const res = await fetch("/api/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Neue Runde gestartet!" });
        setEventStatus("voting");
        // Reload to see new round
        window.location.reload();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Fehler" });
      }
    } catch {
      setMessage({ type: "error", text: "Ein Fehler ist aufgetreten" });
    }
  }

  async function endRound(roundId: string) {
    try {
      const res = await fetch(`/api/rounds?id=${roundId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Runde beendet!" });
        setEventStatus("results");
        window.location.reload();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Fehler" });
      }
    } catch {
      setMessage({ type: "error", text: "Ein Fehler ist aufgetreten" });
    }
  }

  const activeLocations = event.locations.filter((l) => true); // All included since query already filters isActive

  return (
    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {event.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {event.participants.length} Teilnehmer · {activeLocations.length}{" "}
              aktive Orte
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              eventStatus === "setup"
                ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                : eventStatus === "proposal"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : eventStatus === "voting"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : eventStatus === "results"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
            }`}
          >
            {eventStatus}
          </span>
        </div>
      </div>

      {message && (
        <div
          className={`mx-6 mt-4 p-3 rounded-xl text-sm ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Status Controls */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateEventStatus("proposal")}
            disabled={eventStatus === "proposal"}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-700 dark:text-slate-300"
          >
            Vorschlagsphase aktivieren
          </button>
          <button
            onClick={startNewRound}
            disabled={eventStatus === "voting" || activeLocations.length === 0}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Neue Abstimmungsrunde starten
          </button>
        </div>

        {/* Active Locations */}
        {activeLocations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Aktive Orte ({activeLocations.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeLocations.map((loc) => (
                <span
                  key={loc.id}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm rounded-lg"
                >
                  {loc.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Voting Rounds */}
        {event.votingRounds.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Bisherige Runden
            </h3>
            <div className="space-y-2">
              {event.votingRounds.map((round) => (
                <div
                  key={round.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Runde {round.roundNumber}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Status: {round.status}
                      {round.endsAt &&
                        ` · Ende: ${new Date(round.endsAt).toLocaleDateString("de-DE")}`}
                    </p>
                  </div>
                  {round.status === "active" && (
                    <button
                      onClick={() => endRound(round.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      Runde beenden
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
