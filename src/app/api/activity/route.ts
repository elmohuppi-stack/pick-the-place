import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { logError } from "@/lib/log";

/**
 * Aktivitäts-Protokoll eines Events: versendete/fehlgeschlagene Einladungen
 * (aus EmailLog) und abgegebene Stimmen (aus Vote.createdAt), chronologisch.
 * Welchen Ort jemand gewählt hat, wird bewusst NICHT preisgegeben.
 */
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId erforderlich" }, { status: 400 });
  }

  try {
    const [emailLogs, votes] = await Promise.all([
      prisma.emailLog.findMany({
        where: { participant: { eventId } },
        include: {
          participant: { select: { name: true, email: true } },
          votingRound: { select: { roundNumber: true } },
        },
        orderBy: { sentAt: "desc" },
      }),
      prisma.vote.findMany({
        where: { votingRound: { eventId } },
        include: {
          participant: { select: { name: true } },
          votingRound: { select: { roundNumber: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const items = [
      ...emailLogs.map((l) => ({
        id: `email-${l.id}`,
        at: l.sentAt,
        kind:
          l.status === "failed"
            ? ("email_failed" as const)
            : ("email_sent" as const),
        emailType: l.type,
        participant: l.participant.name,
        roundNumber: l.votingRound?.roundNumber ?? null,
        error: l.error,
      })),
      ...votes.map((v) => ({
        id: `vote-${v.id}`,
        at: v.createdAt,
        kind: "vote" as const,
        participant: v.participant.name,
        roundNumber: v.votingRound.roundNumber,
      })),
    ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return NextResponse.json({ items });
  } catch (err) {
    logError("activity.GET", err);
    return NextResponse.json(
      { error: "Protokoll konnte nicht geladen werden" },
      { status: 500 },
    );
  }
}
