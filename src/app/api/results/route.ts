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

  const rounds = await prisma.votingRound.findMany({
    where: { eventId },
    include: {
      votes: true,
    },
    orderBy: { roundNumber: "asc" },
  });

  const locations = await prisma.location.findMany({
    where: { eventId, isActive: true, name: { not: "__optout__" } },
  });

  const roundsWithResults = rounds.map((round) => {
    const totalVotes = round.votes.length;

    const locationResults = locations.map((loc) => {
      const voteCount = round.votes.filter(
        (v) => v.locationId === loc.id,
      ).length;
      return {
        id: loc.id,
        name: loc.name,
        description: loc.description,
        voteCount,
        percentage: totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0,
      };
    });

    return {
      id: round.id,
      roundNumber: round.roundNumber,
      status: round.status,
      votes: round.votes,
      locations: locationResults,
    };
  });

  return NextResponse.json({ rounds: roundsWithResults });
}
