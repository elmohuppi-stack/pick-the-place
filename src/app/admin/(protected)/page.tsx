import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CreateEventForm } from "./create-event-form";

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
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Übersicht über alle Events
          </p>
        </div>
      </div>

      {events.length === 0 && (
        <div className="bg-theme-card backdrop-blur-sm rounded-2xl p-12 shadow-sm border border-theme-card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
            <svg
              className="w-8 h-8 text-indigo-500"
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
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/admin/rounds?eventId=${event.id}`}
                className="block bg-theme-card backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-theme-card hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-theme-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-sm text-theme-secondary mt-0.5">
                      {event.description || "Keine Beschreibung"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-theme-muted">
                    <span>{event._count.participants} TN</span>
                    <span>{event._count.locations} Orte</span>
                    <span>{event._count.votingRounds} Runden</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.status === "setup"
                          ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          : event.status === "proposal"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : event.status === "voting"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : event.status === "results"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
