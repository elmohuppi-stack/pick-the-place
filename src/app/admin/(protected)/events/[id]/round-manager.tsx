"use client";

import { useState, useEffect } from "react";

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
  _count: { votes: number };
}

interface RoundResult {
  id: string;
  locationName: string;
  voteCount: number;
  totalVotes: number;
  percentage: number;
}

interface LocationData {
  id: string;
  name: string;
  description: string | null;
  proposedBy: { name: string };
}

export function RoundManager({ event }: { event: EventData }) {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [results, setResults] = useState<Record<string, RoundResult[]>>({});
  const [expandedRound, setExpandedRound] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/results?eventId=${event.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.rounds) {
          const byRound: Record<string, RoundResult[]> = {};
          for (const r of data.rounds) {
            byRound[r.id] = r.locations.map(
              (loc: {
                id: string;
                name: string;
                voteCount: number;
                percentage: number;
              }) => ({
                id: loc.id,
                locationName: loc.name,
                voteCount: loc.voteCount,
                totalVotes: r.votes.length,
                percentage: loc.percentage,
              }),
            );
          }
          setResults(byRound);
        }
      })
      .catch(() => {});
  }, [event.id]);

  async function endRound(roundId: string) {
    try {
      const res = await fetch(`/api/rounds?id=${roundId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Runde beendet!" });
        window.location.reload();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Fehler" });
      }
    } catch {
      setMessage({ type: "error", text: "Ein Fehler ist aufgetreten" });
    }
  }

  async function deleteRound(roundId: string) {
    if (
      !confirm(
        "Runde wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
      )
    )
      return;

    try {
      const res = await fetch(`/api/rounds?id=${roundId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Runde gelöscht!" });
        window.location.reload();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Fehler" });
      }
    } catch {
      setMessage({ type: "error", text: "Ein Fehler ist aufgetreten" });
    }
  }

  const activeLocations = event.locations;

  return (
    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Abstimmungsrunden
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {event.participants.length} Teilnehmer · {activeLocations.length}{" "}
          aktive Orte
        </p>
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
                  className="px-3 py-1.5 bg-revenexx-50 dark:bg-revenexx-900/20 text-revenexx-700 dark:text-revenexx-300 text-sm rounded-lg"
                >
                  {loc.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Voting Rounds */}
        {event.votingRounds.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Noch keine Abstimmungsrunde gestartet. Nutze oben »Nächster Schritt«.
          </p>
        ) : (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Bisherige Runden
            </h3>
            <div className="space-y-2">
              {event.votingRounds.map((round) => {
                const roundResults = results[round.id];
                const isExpanded = expandedRound === round.id;
                const isClosed = round.status === "closed";

                return (
                  <div
                    key={round.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          Runde {round.roundNumber}
                        </p>
                        {isClosed && (
                          <span className="text-xs text-slate-400">
                            · {round._count.votes} Stimme
                            {round._count.votes !== 1 ? "n" : ""}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {round.status === "closed"
                            ? "Beendet"
                            : round.status === "active"
                              ? "Aktiv"
                              : round.status}
                          {round.endsAt &&
                            ` · ${new Date(round.endsAt).toLocaleDateString("de-DE")}`}
                        </p>
                        {round.status === "active" && (
                          <button
                            onClick={() => endRound(round.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            Beenden
                          </button>
                        )}
                        {(round.status === "closed" ||
                          round.status === "active" ||
                          round.status === "pending") &&
                          round._count.votes === 0 && (
                            <button
                              onClick={() => deleteRound(round.id)}
                              className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              Löschen
                            </button>
                          )}
                        {isClosed && roundResults && (
                          <button
                            onClick={() =>
                              setExpandedRound(isExpanded ? null : round.id)
                            }
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          >
                            <svg
                              className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m19.5 8.25-7.5 7.5-7.5-7.5"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Results Accordion */}
                    {isExpanded && roundResults && (
                      <div className="mt-3 space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                        {roundResults
                          .sort((a, b) => b.voteCount - a.voteCount)
                          .map((result) => (
                            <div key={result.id} className="relative">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                  {result.locationName}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                                  {result.voteCount} Stimme
                                  {result.voteCount !== 1 ? "n" : ""} (
                                  {Math.round(result.percentage)}%)
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-revenexx-500 to-revenexx-500 transition-all"
                                  style={{
                                    width: `${Math.max(result.percentage, 2)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
