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
      votes: { include: { location: true } },
    },
    orderBy: { roundNumber: "asc" },
  });

  const roundsWithResults = rounds.map((round) => {
    // Ergebnisse aus den tatsächlich in DIESER Runde abgegebenen Stimmen
    // ableiten — nicht aus den aktuell aktiven Orten. So bleibt jede Runde
    // korrekt, auch wenn Orte später (z. B. für eine Stichwahl) de-/aktiviert
    // werden.
    const realVotes = round.votes.filter(
      (v) => v.location && v.location.name !== "__optout__",
    );
    const totalVotes = realVotes.length;

    const byLocation = new Map<
      string,
      { id: string; name: string; description: string | null; voteCount: number }
    >();
    for (const vote of realVotes) {
      const loc = vote.location!;
      const entry = byLocation.get(loc.id) ?? {
        id: loc.id,
        name: loc.name,
        description: loc.description,
        voteCount: 0,
      };
      entry.voteCount += 1;
      byLocation.set(loc.id, entry);
    }

    const locationResults = Array.from(byLocation.values()).map((loc) => ({
      ...loc,
      percentage: totalVotes > 0 ? (loc.voteCount / totalVotes) * 100 : 0,
    }));

    return {
      id: round.id,
      roundNumber: round.roundNumber,
      status: round.status,
      votes: realVotes.map((v) => ({ locationId: v.locationId })),
      locations: locationResults,
    };
  });

  return NextResponse.json({ rounds: roundsWithResults });
}
