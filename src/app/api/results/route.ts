import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tallyRoundVotes } from "@/lib/event-status";
import { logError } from "@/lib/log";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json(
      { error: "eventId erforderlich" },
      { status: 400 },
    );
  }

  try {
    const rounds = await prisma.votingRound.findMany({
      where: { eventId },
      include: {
        votes: { include: { location: true } },
      },
      orderBy: { roundNumber: "asc" },
    });

    const roundsWithResults = rounds.map((round) => {
      const realVotes = round.votes.filter(
        (v) => v.location && v.location.name !== "__optout__",
      );
      return {
        id: round.id,
        roundNumber: round.roundNumber,
        status: round.status,
        votes: realVotes.map((v) => ({ locationId: v.locationId })),
        locations: tallyRoundVotes(round.votes),
      };
    });

    return NextResponse.json({ rounds: roundsWithResults });
  } catch (err) {
    logError("results.GET", err);
    return NextResponse.json(
      { error: "Ergebnisse konnten nicht geladen werden" },
      { status: 500 },
    );
  }
}
