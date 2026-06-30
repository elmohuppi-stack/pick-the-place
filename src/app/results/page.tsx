"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ResultsPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <ResultsPage />
    </Suspense>
  );
}

interface LocationResult {
  id: string;
  name: string;
  description: string | null;
  voteCount: number;
  percentage: number;
}

interface RoundData {
  id: string;
  roundNumber: number;
  status: string;
  votes: { locationId: string }[];
  locations: LocationResult[];
}

function ResultsPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [eventData, setEventData] = useState<any>(null);
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [selectedRound, setSelectedRound] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) fetchResults();
  }, [token]);

  async function fetchResults() {
    try {
      // Get participant info
      const meRes = await fetch(`/api/auth/me?token=${token}`);
      if (!meRes.ok) return;
      const meData = await meRes.json();
      setEventData(meData);

      // Get all rounds with votes
      const roundsRes = await fetch(`/api/results?eventId=${meData.event.id}`);
      if (roundsRes.ok) {
        const data = await roundsRes.json();
        setRounds(data.rounds || []);
        setSelectedRound(data.rounds.length - 1);
      }
    } catch {
      console.error("Failed to fetch results");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-slate-500 dark:text-slate-400">
          Kein Zugriffstoken.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentRound = rounds[selectedRound];
  const maxVotes = currentRound?.locations
    ? Math.max(...currentRound.locations.map((l) => l.voteCount), 1)
    : 1;

  // Determine winner (location with >50% of votes)
  const totalVotes =
    currentRound?.locations?.reduce((sum, l) => sum + l.voteCount, 0) || 0;
  const winner = currentRound?.locations?.find((l) => l.percentage > 50);

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          📊 Ergebnisse
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {eventData?.event?.title || "Ergebnisse"}
        </p>
      </div>

      {/* Round selector */}
      {rounds.length > 1 && (
        <div className="flex justify-center gap-2">
          {rounds.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setSelectedRound(i)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedRound === i
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "bg-white/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              }`}
            >
              Runde {r.roundNumber}
            </button>
          ))}
        </div>
      )}

      {!currentRound ? (
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400">
          Keine Ergebnisse verfügbar.
        </div>
      ) : (
        <>
          {/* Winner announcement */}
          {winner && (
            <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-2xl p-8 text-center text-white shadow-lg">
              <p className="text-sm font-medium uppercase tracking-wider opacity-90">
                🏆 Sieger
              </p>
              <p className="text-3xl font-bold mt-2">{winner.name}</p>
              <p className="text-lg mt-1 opacity-90">
                {winner.percentage.toFixed(0)}% der Stimmen
              </p>
            </div>
          )}

          {/* Results chart */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              Runde {currentRound.roundNumber}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {totalVotes} Stimmen insgesamt · Status: {currentRound.status}
            </p>

            <div className="space-y-4">
              {currentRound.locations
                .sort((a, b) => b.voteCount - a.voteCount)
                .map((loc) => (
                  <div key={loc.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {loc.name}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {loc.voteCount} Stimmen ({loc.percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          loc.percentage > 50
                            ? "bg-gradient-to-r from-green-400 to-emerald-500"
                            : loc.percentage === 0
                              ? "bg-slate-300 dark:bg-slate-600"
                              : "bg-gradient-to-r from-indigo-400 to-purple-500"
                        }`}
                        style={{
                          width: `${(loc.voteCount / maxVotes) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
