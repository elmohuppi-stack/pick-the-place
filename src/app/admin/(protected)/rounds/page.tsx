import { prisma } from "@/lib/prisma";
import { RoundManager } from "./round-manager";

export default async function RoundsPage() {
  const events = await prisma.event.findMany({
    include: {
      votingRounds: {
        orderBy: { roundNumber: "desc" },
        include: {
          _count: { select: { votes: true } },
        },
      },
      locations: {
        where: { isActive: true },
        include: {
          proposedBy: { select: { name: true } },
        },
      },
      participants: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Runden verwalten
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Abstimmungsrunden starten, beenden und Ergebnisse einsehen
        </p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-slate-200/60 dark:border-slate-700/60 text-center text-slate-500 dark:text-slate-400">
          Noch keine Events vorhanden.
        </div>
      ) : (
        events.map((event) => <RoundManager key={event.id} event={event} />)
      )}
    </div>
  );
}
