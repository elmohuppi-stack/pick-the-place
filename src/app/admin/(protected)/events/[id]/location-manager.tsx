"use client";

import { useState, useEffect, useCallback } from "react";

interface Location {
  id: string;
  name: string;
  description: string | null;
  proposedById: string;
  isActive: boolean;
  proposedBy: { name: string };
}

export function LocationManager({
  eventId,
  onActiveCountChange,
}: {
  eventId: string;
  /** Meldet die Anzahl aktiver Orte (ohne Enthaltungs-Sentinel) an den Workspace. */
  onActiveCountChange?: (count: number) => void;
}) {
  const [locations, setLocations] = useState<Location[]>([]);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch(`/api/locations?eventId=${eventId}`);
      if (res.ok) setLocations(await res.json());
    } catch {
      console.error("Failed to fetch locations");
    }
  }, [eventId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Aktive-Orte-Anzahl an den Workspace melden (steuert dort den „Weiter"-Button).
  useEffect(() => {
    onActiveCountChange?.(
      locations.filter((l) => l.isActive && l.name !== "__optout__").length,
    );
  }, [locations, onActiveCountChange]);

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await fetch(`/api/locations?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchLocations();
    } catch {
      console.error("Failed to toggle location");
    }
  }

  return (
    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Orte
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Häkchen = Ort steht in der Abstimmung zur Wahl
        </p>
      </div>

      {locations.length === 0 ? (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
          Noch keine Orte vorgeschlagen.
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center justify-between px-6 py-3.5"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(loc.id, loc.isActive)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    loc.isActive
                      ? "bg-revenexx-500 border-revenexx-500 text-white"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {loc.isActive && (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  )}
                </button>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {loc.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Vorgeschlagen von {loc.proposedBy?.name || "Unbekannt"}
                    {loc.description && ` · ${loc.description}`}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  loc.isActive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {loc.isActive ? "Aktiv" : "Inaktiv"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
