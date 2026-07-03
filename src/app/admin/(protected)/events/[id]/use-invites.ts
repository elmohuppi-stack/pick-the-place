"use client";

import { useState, useEffect, useCallback } from "react";

export type InviteType = "proposal" | "vote";

export interface InviteResult {
  type: "success" | "error";
  text: string;
}

interface ActivityItem {
  kind: string;
  emailType?: "proposal_invite" | "vote_invite" | "results";
  participant: string;
  roundNumber: number | null;
}

/**
 * Gemeinsame Versand-Logik für Einladungen – genutzt von den Wizard-Aktionen
 * (step-actions). `proposalSent`/`voteSent` werden aus dem Protokoll
 * abgeleitet (Anzahl verschiedener Teilnehmer mit erfolgreichem Versand), damit
 * beide Stellen anzeigen können, ob bereits eingeladen wurde.
 *
 * `roundNumber` grenzt die gezählten Abstimmungs-Einladungen auf die aktuelle
 * Runde ein – so „vergisst" der Zähler frühere Runden (z. B. vor einer Stichwahl).
 */
export function useInvites(eventId: string, roundNumber?: number | null) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [proposalSent, setProposalSent] = useState<number | null>(null);
  const [voteSent, setVoteSent] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/activity?eventId=${eventId}`);
      if (!res.ok) return;
      const data = await res.json();
      const items: ActivityItem[] = data.items ?? [];

      const proposal = new Set<string>();
      const vote = new Set<string>();
      for (const it of items) {
        if (it.kind !== "email_sent") continue;
        if (it.emailType === "proposal_invite") {
          proposal.add(it.participant);
        } else if (it.emailType === "vote_invite") {
          if (roundNumber == null || it.roundNumber === roundNumber) {
            vote.add(it.participant);
          }
        }
      }
      setProposalSent(proposal.size);
      setVoteSent(vote.size);
    } catch {
      /* Protokoll optional – Fehler ignorieren */
    }
  }, [eventId, roundNumber]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const send = useCallback(
    async (type: InviteType) => {
      setSending(true);
      setResult(null);
      try {
        const res = await fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, type }),
        });
        const data = await res.json();
        if (res.ok) {
          let text = `${data.sent} von ${data.total} E-Mails erfolgreich versendet.`;
          if (data.failed > 0) {
            text += ` ${data.failed} fehlgeschlagen.`;
            if (data.errors?.length) {
              text += ` Details: ${data.errors.join("; ")}`;
            }
          }
          setResult({ type: data.failed > 0 ? "error" : "success", text });
          await refresh();
        } else {
          setResult({
            type: "error",
            text: data.error || "Fehler beim Versenden",
          });
        }
      } catch {
        setResult({ type: "error", text: "Ein Fehler ist aufgetreten" });
      } finally {
        setSending(false);
      }
    },
    [eventId, refresh],
  );

  return { sending, result, setResult, proposalSent, voteSent, send, refresh };
}
