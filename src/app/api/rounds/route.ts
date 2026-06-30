import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      votes: {
        include: {
          location: { select: { name: true } },
          participant: { select: { name: true } },
        },
      },
    },
    orderBy: { roundNumber: "desc" },
  });

  return NextResponse.json(rounds);
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await request.json();

  if (!eventId) {
    return NextResponse.json(
      { error: "eventId erforderlich" },
      { status: 400 },
    );
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      locations: { where: { isActive: true } },
      votingRounds: { orderBy: { roundNumber: "desc" }, take: 1 },
    },
  });

  if (!event) {
    return NextResponse.json(
      { error: "Event nicht gefunden" },
      { status: 404 },
    );
  }

  if (event.locations.length === 0) {
    return NextResponse.json(
      { error: "Keine aktiven Orte für diese Runde" },
      { status: 400 },
    );
  }

  const nextRoundNumber = (event.votingRounds[0]?.roundNumber || 0) + 1;

  const round = await prisma.votingRound.create({
    data: {
      eventId,
      roundNumber: nextRoundNumber,
      status: "active",
      startsAt: new Date(),
    },
  });

  // Update event status to voting
  await prisma.event.update({
    where: { id: eventId },
    data: { status: "voting" },
  });

  return NextResponse.json(round, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id erforderlich" }, { status: 400 });
  }

  const { status, endsAt } = await request.json();

  const updateData: any = {};
  if (status) updateData.status = status;
  if (endsAt) updateData.endsAt = new Date(endsAt);

  const round = await prisma.votingRound.update({
    where: { id },
    data: updateData,
  });

  if (status === "closed") {
    // Update event status to results
    await prisma.event.update({
      where: { id: round.eventId },
      data: { status: "results" },
    });
  }

  return NextResponse.json(round);
}
