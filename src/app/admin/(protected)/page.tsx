import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  statusLabel,
  statusBadgeClasses,
  statusDescription,
  statusDotColor,
  majorityWinner,
  topLocation,
  tallyRoundVotes,
} from "@/lib/event-status";
import { formatDate } from "@/lib/format";
import { CreateEventForm } from "./create-event-form";
import { DeleteEventButton } from "./delete-event-button";
import { IntroHint } from "./intro-hint";

export default async function AdminDashboardPage() {
  const events = await prisma.event.findMany({
    include: {
      _count: {
        select: {
          participants: true,
          locations: true,
          votingRounds: true,
        },
      },
      votingRounds: {
        orderBy: { roundNumber: "desc" },
        take: 1,
        include: {
          votes: { include: { location: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-theme-primary">
                Dashboard
              </h1>
              <IntroHint />
            </div>
            <p className="text-theme-secondary text-sm mt-1">
              Übersicht über alle Events
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-revenexx-200 dark:border-revenexx-900/50 bg-revenexx-50/60 dark:bg-revenexx-900/20 p-5">
          <p className="text-sm text-theme-secondary leading-relaxed">
            Plane ein Event, bei dem der Veranstaltungsort nicht vorgegeben ist,
            sondern von deinen Kollegen{" "}
            <span className="font-medium text-theme-primary">vorgeschlagen</span>{" "}
            und per{" "}
            <span className="font-medium text-theme-primary">Mehrheit</span>{" "}
            abgestimmt wird. Erstelle dazu ein Event und lade die Teilnehmer ein –
            den Rest führt dich der Assistent im Event Schritt für Schritt:
            Vorbereitung → Vorschläge → Abstimmung → Ergebnis.
          </p>
        </div>
      </div>

      {events.length === 0 && (
        <div className="bg-theme-card backdrop-blur-sm rounded-2xl p-12 shadow-sm border border-theme-card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-revenexx-100 dark:bg-revenexx-900/30 mb-4">
            <svg
              className="w-8 h-8 text-revenexx-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-theme-primary mb-1">
            Noch kein Event
          </h2>
          <p className="text-theme-secondary text-sm mb-6">
            Erstelle ein neues Event, um zu starten.
          </p>
          <CreateEventForm />
        </div>
      )}

      {events.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-theme-primary">Events</h2>
            <CreateEventForm />
          </div>

          <div className="grid gap-4">
            {events.map((event) => {
              const lastRound = event.votingRounds[0];
              const results = lastRound
                ? tallyRoundVotes(lastRound.votes)
                : [];
              const winner = majorityWinner(results);
              const favorite = topLocation(results);
              const dateLabel = formatDate(event.eventDate);

              return (
                <div key={event.id} className="relative group">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="block bg-theme-card backdrop-blur-sm rounded-2xl p-6 pl-7 shadow-sm border border-theme-card border-l-4 border-l-transparent hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Statusfarbener Akzentbalken links */}
                    <span
                      aria-hidden
                      className={`absolute left-0 top-0 bottom-0 w-1 ${statusDotColor(event.status)}`}
                    />
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-theme-primary group-hover:text-revenexx-600 dark:group-hover:text-revenexx-400 transition-colors">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-sm text-theme-secondary mt-0.5 truncate">
                            {event.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs">
                          {dateLabel && (
                            <span className="text-theme-muted">
                              📅 {dateLabel}
                            </span>
                          )}
                          <ResultHint
                            status={event.status}
                            winner={winner}
                            favorite={favorite}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-theme-muted shrink-0">
                        <span className="hidden sm:inline">
                          {event._count.participants} TN
                        </span>
                        <span className="hidden sm:inline">
                          {event._count.locations} Orte
                        </span>
                        <span className="hidden sm:inline">
                          {event._count.votingRounds} Runden
                        </span>
                        <span
                          title={statusDescription(event.status)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClasses(event.status)}`}
                        >
                          <span
                            aria-hidden
                            className={`w-1.5 h-1.5 rounded-full ${statusDotColor(event.status)}`}
                          />
                          {statusLabel(event.status)}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DeleteEventButton eventId={event.id} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Zeigt Sieger (results/closed) bzw. aktuellen Favoriten (voting) unter dem Titel. */
function ResultHint({
  status,
  winner,
  favorite,
}: {
  status: string;
  winner: { name: string; percentage: number } | null;
  favorite: { name: string; percentage: number } | null;
}) {
  if (status === "voting" && favorite) {
    return (
      <span className="text-theme-muted">
        ⏳ Führt: {favorite.name} ({Math.round(favorite.percentage)}%)
      </span>
    );
  }
  if (status === "results" || status === "closed") {
    if (winner) {
      return (
        <span className="font-medium text-blue-600 dark:text-blue-400">
          🏆 Sieger: {winner.name} ({Math.round(winner.percentage)}%)
        </span>
      );
    }
    if (favorite) {
      return (
        <span className="text-amber-600 dark:text-amber-400">
          Favorit: {favorite.name} ({Math.round(favorite.percentage)}%)
        </span>
      );
    }
  }
  return null;
}
