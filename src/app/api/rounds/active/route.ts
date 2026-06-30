import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json(
      { error: "eventId erforderlich" },
      { status: 400 },
    );
  }

  const round = await prisma.votingRound.findFirst({
    where: { eventId, status: "active" },
    orderBy: { roundNumber: "desc" },
  });

  if (!round) {
    return NextResponse.json({ error: "Keine aktive Runde" }, { status: 404 });
  }

  return NextResponse.json(round);
}
