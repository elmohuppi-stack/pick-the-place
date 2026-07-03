"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDateTime } from "@/lib/format";

interface ActivityItem {
  id: string;
  at: string;
  kind: "email_sent" | "email_failed" | "vote";
  emailType?: "proposal_invite" | "vote_invite" | "results";
  participant: string;
  roundNumber: number | null;
  error?: string | null;
}

export function ActivityLog({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/activity?eventId=${eventId}`);
      if (!res.ok) {
        setError("Protokoll konnte nicht geladen werden.");
        return;
      }
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setError("Protokoll konnte nicht geladen werden.");
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400 py-6">{error}</p>
    );
  }

  if (items === null) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin w-6 h-6 border-4 border-revenexx-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-theme-card backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-theme-card text-center">
        <p className="text-sm text-theme-secondary">
          Noch keine Aktivität. Sobald Einladungen versendet werden oder
          Teilnehmer abstimmen, erscheint hier ein Protokoll.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-theme-card backdrop-blur-sm rounded-2xl shadow-sm border border-theme-card divide-y divide-theme-card">
      {items.map((item) => (
        <LogRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function LogRow({ item }: { item: ActivityItem }) {
  const time = formatDateTime(item.at);

  let icon = "🗳️";
  let text: React.ReactNode;

  if (item.kind === "vote") {
    icon = "🗳️";
    text = (
      <>
        <span className="font-medium text-theme-primary">
          {item.participant}
        </span>{" "}
        hat abgestimmt
        {item.roundNumber != null && ` (Runde ${item.roundNumber})`}
      </>
    );
  } else if (item.kind === "email_failed") {
    icon = "⚠️";
    text = (
      <>
        E-Mail an{" "}
        <span className="font-medium text-theme-primary">
          {item.participant}
        </span>{" "}
        fehlgeschlagen
        {item.error && (
          <span className="block text-xs text-red-600 dark:text-red-400 mt-0.5">
            {item.error}
          </span>
        )}
      </>
    );
  } else {
    icon = "📨";
    const label =
      item.emailType === "proposal_invite"
        ? "Einladung zur Vorschlagsphase"
        : item.emailType === "vote_invite"
          ? `Einladung zur Abstimmung${item.roundNumber != null ? ` (Runde ${item.roundNumber})` : ""}`
          : "Ergebnis-Benachrichtigung";
    text = (
      <>
        {label} an{" "}
        <span className="font-medium text-theme-primary">
          {item.participant}
        </span>{" "}
        gesendet
      </>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4">
      <span className="text-lg leading-none mt-0.5" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-theme-secondary">{text}</p>
      </div>
      {time && (
        <span className="shrink-0 text-xs text-theme-muted whitespace-nowrap">
          {time}
        </span>
      )}
    </div>
  );
}
