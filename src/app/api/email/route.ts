import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { sendProposalInvite, sendVoteInvite } from "@/lib/email";
import { logError } from "@/lib/log";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId, type } = await request.json();

  if (!eventId || !type) {
    return NextResponse.json(
      { error: "eventId und type erforderlich" },
      { status: 400 },
    );
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { title: true, proposalEmailText: true, voteEmailText: true },
  });

  if (!event) {
    return NextResponse.json(
      { error: "Event nicht gefunden" },
      { status: 404 },
    );
  }

  if (type !== "proposal" && type !== "vote") {
    return NextResponse.json({ error: "Ungültiger Typ" }, { status: 400 });
  }

  const participants = await prisma.participant.findMany({
    where: { eventId, isActive: true },
  });

  if (participants.length === 0) {
    return NextResponse.json(
      { error: "Keine aktiven Teilnehmer gefunden" },
      { status: 400 },
    );
  }

  // Für Abstimmungs-Einladungen die aktive Runde einmalig ermitteln – so lässt
  // sich das Protokoll später einer konkreten Runde zuordnen.
  let activeRoundId: string | null = null;
  let activeRoundNumber = 0;
  if (type === "vote") {
    const round = await prisma.votingRound.findFirst({
      where: { eventId, status: "active" },
      orderBy: { roundNumber: "desc" },
    });
    if (!round) {
      return NextResponse.json(
        { error: "Keine aktive Abstimmungsrunde" },
        { status: 400 },
      );
    }
    activeRoundId = round.id;
    activeRoundNumber = round.roundNumber;
  }

  const logType = type === "proposal" ? "proposal_invite" : "vote_invite";

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const participant of participants) {
    let ok = false;
    let reason: string | null = null;

    try {
      const result =
        type === "proposal"
          ? await sendProposalInvite(
              participant.email,
              participant.name,
              participant.authToken,
              event.title,
              event.proposalEmailText,
            )
          : await sendVoteInvite(
              participant.email,
              participant.name,
              participant.authToken,
              activeRoundNumber,
              event.title,
              event.voteEmailText,
            );

      ok = result.success;
      if (!ok) {
        const err = (result as { error?: unknown }).error;
        reason =
          typeof err === "string"
            ? err
            : (err as { message?: string })?.message || "Unbekannter Fehler";
      }
    } catch (err) {
      logError("email.POST", err);
      reason = err instanceof Error ? err.message : "Unbekannter Fehler";
    }

    // Versand IMMER protokollieren – auch Fehlversuche, damit sie nachvollziehbar
    // bleiben (statt nur flüchtig in der HTTP-Antwort).
    try {
      await prisma.emailLog.create({
        data: {
          participantId: participant.id,
          votingRoundId: activeRoundId,
          type: logType,
          status: ok ? "sent" : "failed",
          error: reason,
        },
      });
    } catch (err) {
      logError("email.POST.log", err);
    }

    if (ok) {
      sent++;
    } else {
      errors.push(`${participant.email}: ${reason}`);
      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    failed,
    total: participants.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
