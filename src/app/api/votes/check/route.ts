import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyParticipantToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const roundId = searchParams.get("roundId");

  if (!token || !roundId) {
    return NextResponse.json(
      { error: "token und roundId erforderlich" },
      { status: 400 },
    );
  }

  const participant = await verifyParticipantToken(token);
  if (!participant) {
    return NextResponse.json({ error: "Ungültiger Token" }, { status: 401 });
  }

  const vote = await prisma.vote.findUnique({
    where: {
      votingRoundId_participantId: {
        votingRoundId: roundId,
        participantId: participant.id,
      },
    },
  });

  return NextResponse.json({ hasVoted: !!vote });
}
