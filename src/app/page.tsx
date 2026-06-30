import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const event = await prisma.event.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const phaseLabels: Record<string, string> = {
    setup: "Vorbereitung",
    proposal: "📝 Vorschlagsphase",
    voting: "🗳️ Abstimmungsphase",
    results: "📊 Ergebnisse",
    closed: "Abgeschlossen",
  };

  const phaseDescriptions: Record<string, string> = {
    setup: "Die Abstimmung wurde noch nicht gestartet.",
    proposal: "Schlage einen Ort für das Jahrestreffen vor!",
    voting: "Die Abstimmung läuft – wähle deinen Favoriten!",
    results: "Die Ergebnisse sind da – schau rein!",
    closed: "Diese Veranstaltung ist abgeschlossen.",
  };

  const phaseColors: Record<string, string> = {
    setup: "bg-slate-400",
    proposal: "bg-amber-400",
    voting: "bg-green-400",
    results: "bg-blue-400",
    closed: "bg-purple-400",
  };

  const status = event?.status || "setup";

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
          <svg
            className="w-10 h-10 text-white"
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
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Pick the Place
          </h1>
          <p className="mt-3 text-slate-700 dark:text-slate-300 text-lg">
            {event?.title ||
              "Findet gemeinsam den Ort für euer nächstes Jahrestreffen"}
          </p>
        </div>

        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center justify-center gap-2 text-slate-800 dark:text-white mb-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${phaseColors[status]} animate-pulse`}
            />
            <span className="text-sm font-semibold uppercase tracking-wider">
              {phaseLabels[status]}
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-200">
            {phaseDescriptions[status]}
          </p>
        </div>

        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
          Admin-Bereich
        </Link>
      </div>
    </div>
  );
}
