import { prisma } from "@/lib/prisma";
import { LocationManager } from "./location-manager";

export default async function LocationsPage() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Orte verwalten
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Vorgeschlagene Orte ansehen und für Abstimmungen (de)aktivieren
        </p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-slate-200/60 dark:border-slate-700/60 text-center text-slate-500 dark:text-slate-400">
          Noch keine Events vorhanden. Erstelle zuerst ein Event im Dashboard.
        </div>
      ) : (
        events.map((event) => <LocationManager key={event.id} event={event} />)
      )}
    </div>
  );
}
