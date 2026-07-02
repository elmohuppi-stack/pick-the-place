"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { statusLabel, statusBadgeClasses } from "@/lib/event-status";
import { PhaseStepper } from "./phase-stepper";
import { ParticipantManager } from "./participant-manager";
import { LocationManager } from "./location-manager";
import { RoundManager } from "./round-manager";
import { EmailManager } from "./email-manager";

interface WorkspaceEvent {
  id: string;
  title: string;
  description: string | null;
  status: string;
  proposalEmailText: string | null;
  voteEmailText: string | null;
  participants: { id: string; name: string; email: string }[];
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

const TABS = [
  { key: "overview", label: "Übersicht" },
  { key: "participants", label: "Teilnehmer" },
  { key: "locations", label: "Orte" },
  { key: "rounds", label: "Runden" },
  { key: "email", label: "E-Mails" },
];

export function EventWorkspace({ event }: { event: WorkspaceEvent }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const activeLocations = event.locations.filter(
    (l) => l.isActive && l.name !== "__optout__",
  );
  const activeRound =
    event.votingRounds.find((r) => r.status === "active") ?? null;

  function selectTab(tab: string) {
    router.push(`${pathname}?tab=${tab}`, { scroll: false });
  }

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
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {event.description || "Keine Beschreibung"}
            </p>
          </div>
          <span
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClasses(event.status)}`}
          >
            {statusLabel(event.status)}
          </span>
        </div>
      </div>

      {/* Phase stepper + next step */}
      <PhaseStepper
        eventId={event.id}
        status={event.status}
        participantCount={event.participants.length}
        activeLocationCount={activeLocations.length}
        activeRoundId={activeRound?.id ?? null}
        roundCount={event.votingRounds.length}
      />

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => selectTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "border-revenexx-500 text-revenexx-600 dark:text-revenexx-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "overview" && (
          <Overview
            event={event}
            activeLocationCount={activeLocations.length}
            onGoTab={selectTab}
          />
        )}
        {activeTab === "participants" && (
          <ParticipantManager eventId={event.id} />
        )}
        {activeTab === "locations" && <LocationManager eventId={event.id} />}
        {activeTab === "rounds" && (
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
        {activeTab === "email" && (
          <EmailManager
            event={{
              id: event.id,
              title: event.title,
              proposalEmailText: event.proposalEmailText,
              voteEmailText: event.voteEmailText,
            }}
          />
        )}
      </div>
    </div>
  );
}

function Overview({
  event,
  activeLocationCount,
  onGoTab,
}: {
  event: WorkspaceEvent;
  activeLocationCount: number;
  onGoTab: (tab: string) => void;
}) {
  const stats = [
    { label: "Teilnehmer", value: event.participants.length, tab: "participants" },
    { label: "Orte (aktiv)", value: activeLocationCount, tab: "locations" },
    { label: "Runden", value: event.votingRounds.length, tab: "rounds" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <button
          key={s.label}
          onClick={() => onGoTab(s.tab)}
          className="bg-theme-card backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-theme-card text-left hover:shadow-md transition-all"
        >
          <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
            {s.value}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {s.label}
          </p>
        </button>
      ))}
    </div>
  );
}
