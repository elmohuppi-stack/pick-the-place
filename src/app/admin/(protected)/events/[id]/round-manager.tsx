"use client";

import { useState, useEffect } from "react";

interface EventData {
  id: string;
  title: string;
  status: string;
  votingRounds: VotingRoundData[];
  locations: LocationData[];
  participants: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  }[];
}

/** Live-Kennzahlen einer Runde aus /api/results. */
interface RoundMeta {
  status: string;
  respondedCount: number;
  abstentions: number;
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
  const [roundMeta, setRoundMeta] = useState<Record<string, RoundMeta>>({});
  const [expandedRound, setExpandedRound] = useState<string | null>(null);

  const activeRound =
    event.votingRounds.find((r) => r.status === "active") ?? null;
  const activeRoundId = activeRound?.id ?? null;

  // Ergebnisse laden – und solange eine Runde läuft, alle paar Sekunden neu,
  // damit der Admin live sieht, wer schon abgestimmt hat und wie es steht.
  useEffect(() => {
    let cancelled = false;

    async function loadResults() {
      try {
        const res = await fetch(`/api/results?eventId=${event.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.rounds) return;

        const byRound: Record<string, RoundResult[]> = {};
        const meta: Record<string, RoundMeta> = {};
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
          meta[r.id] = {
            status: r.status,
            respondedCount: r.respondedCount ?? r.votes.length,
            abstentions: r.abstentions ?? 0,
          };
        }
        setResults(byRound);
        setRoundMeta(meta);

        // Runde serverseitig geschlossen (alle abgestimmt / manuell beendet)?
        // Dann neu laden, damit Phase & »Bisherige Runden« aktuell sind.
        if (
          activeRoundId &&
          meta[activeRoundId] &&
          meta[activeRoundId].status !== "active"
        ) {
          window.location.reload();
        }
      } catch {
        // Netzwerkfehler beim Polling ignorieren – nächster Tick versucht's erneut.
      }
    }

    loadResults();
    if (!activeRoundId) return;
    const interval = setInterval(loadResults, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [event.id, activeRoundId]);

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

  // Live-Kennzahlen der laufenden Runde (aus den gepollten Ergebnissen)
  const activeParticipantCount = event.participants.filter(
    (p) => p.isActive,
  ).length;
  const activeMeta = activeRoundId ? roundMeta[activeRoundId] : undefined;
  const activeResults = activeRoundId ? results[activeRoundId] : undefined;
  const respondedCount = activeMeta?.respondedCount ?? 0;
  const abstentions = activeMeta?.abstentions ?? 0;
  const realVoteTotal = respondedCount - abstentions;
  const votedPercent =
    activeParticipantCount > 0
      ? Math.min(100, (respondedCount / activeParticipantCount) * 100)
      : 0;

  const countById = new Map<string, number>(
    (activeResults ?? []).map((r) => [r.id, r.voteCount]),
  );
  const maxLiveCount = Math.max(0, ...countById.values());
  const liveTally = activeLocations
    .map((loc) => {
      const voteCount = countById.get(loc.id) ?? 0;
      return {
        id: loc.id,
        name: loc.name,
        voteCount,
        percentage:
          realVoteTotal > 0 ? (voteCount / realVoteTotal) * 100 : 0,
        isLeader: maxLiveCount > 0 && voteCount === maxLiveCount,
      };
    })
    .sort((a, b) => b.voteCount - a.voteCount);

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
        {/* Live-Auswertung der laufenden Runde */}
        {activeRound && (
          <div className="rounded-xl border border-green-200 dark:border-green-800/50 bg-green-50/60 dark:bg-green-900/10 p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Runde {activeRound.roundNumber} läuft
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                aktualisiert automatisch
              </span>
            </div>

            {/* Teilnahme-Fortschritt */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {respondedCount} von {activeParticipantCount} haben abgestimmt
                  {abstentions > 0 && (
                    <span className="text-slate-500 dark:text-slate-400 font-normal">
                      {" "}
                      · {abstentions} Enthaltung{abstentions !== 1 ? "en" : ""}
                    </span>
                  )}
                </span>
                <span className="tabular-nums text-slate-500 dark:text-slate-400">
                  {Math.round(votedPercent)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${votedPercent}%` }}
                />
              </div>
              {activeParticipantCount - respondedCount > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  Noch offen:{" "}
                  {activeParticipantCount - respondedCount} Teilnehmer
                </p>
              )}
            </div>

            {/* Live-Zwischenstand pro Ort */}
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Zwischenstand
              </p>
              {realVoteTotal === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Noch keine Stimme für einen Ort abgegeben.
                </p>
              ) : (
                liveTally.map((loc) => (
                  <div key={loc.id} className="relative">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span
                        className={`font-medium ${
                          loc.isLeader
                            ? "text-green-700 dark:text-green-400"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {loc.name}
                        {loc.isLeader && " 🏆"}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                        {loc.voteCount} Stimme{loc.voteCount !== 1 ? "n" : ""} (
                        {Math.round(loc.percentage)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          loc.isLeader ? "bg-green-500" : "bg-revenexx-500"
                        }`}
                        style={{ width: `${Math.max(loc.percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

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
            Noch keine Abstimmungsrunde gestartet. Starte sie über die Aktion
            oben.
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
