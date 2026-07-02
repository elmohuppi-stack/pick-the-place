"use client";

import { Suspense, useState, useEffect, FormEvent } from "react";
import { useSearchParams } from "next/navigation";

export default function ProposePageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="animate-spin w-8 h-8 border-4 border-revenexx-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <ProposePage />
    </Suspense>
  );
}

interface Location {
  id: string;
  name: string;
  description: string | null;
  proposedBy: { name: string };
}

interface Participant {
  id: string;
  name: string;
  email: string;
  authToken: string;
}

function ProposePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [eventStatus, setEventStatus] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [optedOut, setOptedOut] = useState(false);

  useEffect(() => {
    if (token) {
      fetchParticipant();
    }
  }, [token]);

  async function fetchParticipant() {
    try {
      const res = await fetch(`/api/auth/me?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setParticipant(data.participant);
        setEventStatus(data.event.status);
        setOptedOut(data.hasOptedOut);
        fetchLocations();
      }
    } catch {
      console.error("Failed to fetch participant");
    }
  }

  async function fetchLocations() {
    try {
      const res = await fetch(`/api/locations?token=${token}`);
      if (res.ok) {
        setLocations(await res.json());
      }
    } catch {
      console.error("Failed to fetch locations");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/locations?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Ort vorgeschlagen!" });
        setName("");
        setDescription("");
        fetchLocations();
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

  async function handleOptOut() {
    setLoading(true);
    try {
      const res = await fetch(`/api/participants/optout?token=${token}`, {
        method: "POST",
      });
      if (res.ok) {
        setOptedOut(true);
        setMessage({
          type: "success",
          text: "Du hast auf einen Vorschlag verzichtet.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Fehler" });
    } finally {
      setLoading(false);
    }
  }

  const hasProposed = locations.some(
    (l) => l.proposedBy.name === participant?.name,
  );

  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center text-slate-500 dark:text-slate-400">
          <p>Kein Zugriffstoken. Bitte verwende den Link aus der E-Mail.</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="animate-spin w-8 h-8 border-4 border-revenexx-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (eventStatus !== "proposal") {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
            <svg
              className="w-8 h-8 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
            Vorschlagsphase ist vorbei
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Die Vorschlagsphase ist nicht mehr aktiv.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          🌍 Ort vorschlagen
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Hallo {participant.name}! Welchen Ort schlägst du vor?
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

      {/* Existing Proposals */}
      <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Bereits vorgeschlagen ({locations.length})
        </h2>
        {locations.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Noch keine Vorschläge. Sei der Erste!
          </p>
        ) : (
          <div className="space-y-3">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-revenexx-100 dark:bg-revenexx-900/30 flex items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4 text-revenexx-600 dark:text-revenexx-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
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
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">
                    {loc.name}
                  </p>
                  {loc.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {loc.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    von {loc.proposedBy.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proposal Form */}
      {!hasProposed && !optedOut && (
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Ort vorschlagen
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Ort *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-revenexx-500 outline-none text-sm"
                placeholder="z.B. Barcelona, Spanien"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Warum dieser Ort? (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-revenexx-500 outline-none text-sm resize-none"
                rows={3}
                placeholder="Ideales Wetter, tolle Location, ..."
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 btn btn-primary disabled:opacity-50"
            >
              {loading ? "Wird gesendet..." : "Ort vorschlagen"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleOptOut}
              disabled={loading}
              className="w-full py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Kein Vorschlag – ich möchte nicht vorschlagen
            </button>
          </div>
        </div>
      )}

      {(hasProposed || optedOut) && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 text-center">
          <p className="text-green-700 dark:text-green-400 font-medium">
            {hasProposed
              ? "✅ Du hast bereits einen Ort vorgeschlagen!"
              : "⏭️ Du hast auf einen Vorschlag verzichtet."}
          </p>
        </div>
      )}
    </div>
  );
}
