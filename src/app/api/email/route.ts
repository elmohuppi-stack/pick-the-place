import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { sendProposalInvite, sendVoteInvite } from "@/lib/email";

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

  const participants = await prisma.participant.findMany({
    where: { eventId },
  });

  if (participants.length === 0) {
    return NextResponse.json(
      { error: "Keine Teilnehmer gefunden" },
      { status: 400 },
    );
  }

  let sent = 0;
  let failed = 0;

  for (const participant of participants) {
    try {
      let result;

      if (type === "proposal") {
        result = await sendProposalInvite(
          participant.email,
          participant.name,
          participant.authToken,
        );
      } else if (type === "vote") {
        // Find the latest active voting round
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

        result = await sendVoteInvite(
          participant.email,
          participant.name,
          participant.authToken,
          round.roundNumber,
        );
      } else {
        return NextResponse.json({ error: "Ungültiger Typ" }, { status: 400 });
      }

      if (result.success) {
        await prisma.emailLog.create({
          data: {
            participantId: participant.id,
            type: type === "proposal" ? "proposal_invite" : "vote_invite",
          },
        });
        sent++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    failed,
    total: participants.length,
  });
}
