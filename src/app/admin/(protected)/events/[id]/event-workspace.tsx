"use client";

import Link from "next/link";
import { useState } from "react";
import {
  statusLabel,
  statusBadgeClasses,
  statusDescription,
} from "@/lib/event-status";
import { formatDate } from "@/lib/format";
import { StepActions } from "./step-actions";
import { ParticipantManager } from "./participant-manager";
import { LocationManager } from "./location-manager";
import { RoundManager } from "./round-manager";
import { ActivityLog } from "./activity-log";

interface WorkspaceEvent {
  id: string;
  title: string;
  description: string | null;
  status: string;
  eventDate: string | Date | null;
  proposalEmailText: string | null;
  voteEmailText: string | null;
  participants: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  }[];
  locations: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    proposedBy: { name: string };
  }[];
  votingRounds: {
    id: string;
    roundNumber: number;
    status: string;
    startsAt: string | Date | null;
    endsAt: string | Date | null;
    _count: { votes: number };
  }[];
}

const STEPS = [
  {
    key: "setup",
    label: "Teilnehmer",
    description:
      "Prüfe die Teilnehmer und lade sie ein, Orte für das Event vorzuschlagen.",
  },
  {
    key: "proposal",
    label: "Vorschläge",
    description:
      "Teilnehmer schlagen Orte vor. Aktiviere die Orte, über die abgestimmt werden soll.",
  },
  {
    key: "voting",
    label: "Abstimmung",
    description: "Die Abstimmung läuft – verfolge den Fortschritt live.",
  },
  {
    key: "results",
    label: "Ergebnis",
    description: "Das Ergebnis der Abstimmung.",
  },
];

function currentStepIndex(status: string): number {
  if (status === "closed") return STEPS.length - 1;
  const i = STEPS.findIndex((s) => s.key === status);
  return i === -1 ? 0 : i;
}

export function EventWorkspace({ event }: { event: WorkspaceEvent }) {
  const activeLocations = event.locations.filter(
    (l) => l.isActive && l.name !== "__optout__",
  );
  const activeRound =
    event.votingRounds.find((r) => r.status === "active") ?? null;

  const currentIdx = currentStepIndex(event.status);
  const isClosed = event.status === "closed";
  const [selected, setSelected] = useState(currentIdx);
  const [showLog, setShowLog] = useState(false);

  const step = STEPS[selected];
  const onCurrent = selected === currentIdx;
  const viewingPast = selected < currentIdx;

  const stats = [
    { label: "Teilnehmer", value: event.participants.length },
    { label: "Orte aktiv", value: activeLocations.length },
    { label: "Runden", value: event.votingRounds.length },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-revenexx-600 dark:hover:text-revenexx-400 transition-colors mb-3"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          Alle Events
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {event.title}
            </h1>
            {event.description && (
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {event.description}
              </p>
            )}
            {formatDate(event.eventDate) && (
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                📅 {formatDate(event.eventDate)}
              </p>
            )}
          </div>
          <span
            title={statusDescription(event.status)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClasses(event.status)}`}
          >
            {statusLabel(event.status)}
          </span>
        </div>

        {/* Kennzahlen */}
        <div className="flex flex-wrap gap-2 mt-4">
          {stats.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-xl bg-theme-card border border-theme-card text-sm"
            >
              <span className="font-semibold text-theme-primary tabular-nums">
                {s.value}
              </span>
              <span className="text-theme-muted">{s.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Klickbare Step-Leiste */}
      <StepRail
        currentIdx={currentIdx}
        selected={selected}
        isClosed={isClosed}
        onSelect={setSelected}
      />

      {/* Beschreibung des aktuellen Schritts */}
      <div>
        <h2 className="text-lg font-semibold text-theme-primary">
          {step.label}
        </h2>
        <p className="text-sm text-theme-secondary mt-0.5">
          {step.description}
        </p>
      </div>

      {/* Hinweis beim Zurückspringen auf einen abgeschlossenen Schritt */}
      {viewingPast && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-theme-card bg-slate-50/50 dark:bg-slate-900/30 px-4 py-3">
          <p className="text-sm text-theme-secondary">
            ✓ Abgeschlossener Schritt – nur zur Ansicht.
          </p>
          <button
            onClick={() => setSelected(currentIdx)}
            className="shrink-0 text-sm font-medium text-revenexx-600 dark:text-revenexx-400 hover:underline"
          >
            Zum aktuellen Schritt
          </button>
        </div>
      )}

      {/* Aktionen nur im aktuellen Schritt */}
      {onCurrent && (
        <StepActions
          eventId={event.id}
          status={event.status}
          participantCount={event.participants.length}
          activeLocationCount={activeLocations.length}
          activeRoundId={activeRound?.id ?? null}
          activeRoundNumber={activeRound?.roundNumber ?? null}
          proposalEmailText={event.proposalEmailText}
          voteEmailText={event.voteEmailText}
        />
      )}

      {/* Panel des gewählten Schritts */}
      <div>
        {step.key === "setup" && (
          <ParticipantManager eventId={event.id} status={event.status} />
        )}
        {step.key === "proposal" && <LocationManager eventId={event.id} />}
        {(step.key === "voting" || step.key === "results") && (
          <RoundManager
            event={{
              id: event.id,
              title: event.title,
              status: event.status,
              votingRounds: event.votingRounds,
              locations: activeLocations.map((l) => ({
                id: l.id,
                name: l.name,
                description: l.description,
                proposedBy: l.proposedBy,
              })),
              participants: event.participants,
            }}
          />
        )}
      </div>

      {/* Protokoll (phasenübergreifend, ausklappbar) */}
      <div className="border-t border-theme-card pt-4">
        <button
          onClick={() => setShowLog((v) => !v)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-revenexx-600 dark:hover:text-revenexx-400 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showLog ? "rotate-180" : ""}`}
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
          {showLog ? "Protokoll ausblenden" : "Protokoll anzeigen"}
        </button>
        {showLog && (
          <div className="mt-3">
            <ActivityLog eventId={event.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function StepRail({
  currentIdx,
  selected,
  isClosed,
  onSelect,
}: {
  currentIdx: number;
  selected: number;
  isClosed: boolean;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const reached = isClosed || i <= currentIdx;
        const done = isClosed || i < currentIdx;
        const isCurrent = !isClosed && i === currentIdx;
        const isSelected = i === selected;

        return (
          <div
            key={s.key}
            className="flex items-center flex-1 last:flex-none"
          >
            <button
              type="button"
              disabled={!reached}
              onClick={() => reached && onSelect(i)}
              className={`flex flex-col items-center group ${
                reached ? "cursor-pointer" : "cursor-not-allowed"
              }`}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isSelected ? "ring-4 ring-revenexx-500/20" : ""
                } ${
                  isCurrent
                    ? "bg-revenexx-500 text-white"
                    : done
                      ? "bg-revenexx-500 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}
              >
                {done ? (
                  <svg
                    className="w-4 h-4"
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
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`mt-1.5 text-xs whitespace-nowrap ${
                  isSelected
                    ? "font-semibold text-revenexx-600 dark:text-revenexx-400"
                    : reached
                      ? "text-slate-600 dark:text-slate-300"
                      : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 mb-5 ${
                  done ? "bg-revenexx-500" : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
