"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function VotePageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <VotePage />
    </Suspense>
  );
}

interface Location {
  id: string;
  name: string;
  description: string | null;
}

interface VotingRound {
  id: string;
  roundNumber: number;
  status: string;
}

interface Participant {
  id: string;
  name: string;
}

function VotePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [eventStatus, setEventStatus] = useState("");
  const [round, setRound] = useState<VotingRound | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  async function fetchData() {
    try {
      // Get participant info
      const meRes = await fetch(`/api/auth/me?token=${token}`);
      if (!meRes.ok) return;
      const meData = await meRes.json();
      setParticipant(meData.participant);
      setEventStatus(meData.event.status);

      // Get active round
      const roundRes = await fetch(
        `/api/rounds/active?eventId=${meData.event.id}`,
      );
      if (roundRes.ok) {
        const roundData = await roundRes.json();
        setRound(roundData);

        // Get locations
        const locRes = await fetch(`/api/locations?eventId=${meData.event.id}`);
        if (locRes.ok) {
          const locs = await locRes.json();
          setLocations(locs.filter((l: any) => l.isActive));
        }

        // Check if already voted
        const voteRes = await fetch(
          `/api/votes/check?token=${token}&roundId=${roundData.id}`,
        );
        if (voteRes.ok) {
          const voteData = await voteRes.json();
          if (voteData.hasVoted) setHasVoted(true);
        }
      }
    } catch {
      console.error("Failed to fetch data");
    }
  }

  async function handleVote() {
    if (!selectedLocationId || !round) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/votes?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          votingRoundId: round.id,
          locationId: selectedLocationId,
        }),
      });

      if (res.ok) {
        setHasVoted(true);
        setMessage({ type: "success", text: "✅ Deine Stimme wurde gezählt!" });

        // Check if all voted (auto-closed)
        const roundRes = await fetch(`/api/rounds/active?eventId=${round.id}`);
        // ignore result, just show success
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Fehler" });
      }
    } catch {
      setMessage({ type: "error", text: "Ein Fehler ist aufgetreten" });
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

  if (!participant) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (eventStatus === "results" || eventStatus === "closed") {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <svg
              className="w-8 h-8 text-blue-500"
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
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
            Abstimmung beendet
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Die Abstimmung ist abgeschlossen.
          </p>
        </div>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <svg
              className="w-8 h-8 text-green-500"
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
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
            Danke für deine Stimme! 🗳️
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Du hast erfolgreich abgestimmt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          🗳️ Runde {round?.roundNumber || "?"}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Hallo {participant.name}! Wähle deinen Favoriten.
        </p>
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

      {locations.length === 0 ? (
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400">
          Keine Orte verfügbar.
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocationId(loc.id)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                selectedLocationId === loc.id
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md"
                  : "border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-600"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    selectedLocationId === loc.id
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-400"
                  }`}
                >
                  {selectedLocationId === loc.id ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {loc.name}
                  </p>
                  {loc.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {loc.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedLocationId && (
        <button
          onClick={handleVote}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all text-lg"
        >
          {loading ? "Wird gesendet..." : "Jetzt abstimmen"}
        </button>
      )}
    </div>
  );
}
