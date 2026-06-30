import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyParticipantToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const participant = token ? await verifyParticipantToken(token) : null;
  if (!participant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { votingRoundId, locationId } = await request.json();

  if (!votingRoundId || !locationId) {
    return NextResponse.json(
      { error: "votingRoundId und locationId erforderlich" },
      { status: 400 },
    );
  }

  // Verify round is active
  const round = await prisma.votingRound.findUnique({
    where: { id: votingRoundId },
  });

  if (!round || round.status !== "active") {
    return NextResponse.json(
      { error: "Diese Runde ist nicht aktiv" },
      { status: 400 },
    );
  }

  if (round.eventId !== participant.eventId) {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  // Check if already voted
  const existing = await prisma.vote.findUnique({
    where: {
      votingRoundId_participantId: {
        votingRoundId,
        participantId: participant.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Du hast bereits abgestimmt" },
      { status: 409 },
    );
  }

  // Check if deadline passed
  if (round.endsAt && new Date() > round.endsAt) {
    return NextResponse.json(
      { error: "Die Abstimmungsfrist ist abgelaufen" },
      { status: 400 },
    );
  }

  const vote = await prisma.vote.create({
    data: {
      votingRoundId,
      participantId: participant.id,
      locationId,
    },
  });

  // Check if all participants voted → auto-close round
  const totalParticipants = await prisma.participant.count({
    where: { eventId: participant.eventId },
  });

  const totalVotes = await prisma.vote.count({
    where: { votingRoundId },
  });

  if (totalVotes >= totalParticipants) {
    await prisma.votingRound.update({
      where: { id: votingRoundId },
      data: { status: "closed" },
    });

    await prisma.event.update({
      where: { id: participant.eventId },
      data: { status: "results" },
    });
  }

  return NextResponse.json(vote, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const votingRoundId = searchParams.get("votingRoundId");
  const token = searchParams.get("token");

  if (!votingRoundId) {
    return NextResponse.json(
      { error: "votingRoundId erforderlich" },
      { status: 400 },
    );
  }

  // Verify access
  if (token) {
    const participant = await verifyParticipantToken(token);
    if (!participant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    const admin = await getAdminSession_proxy();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const votes = await prisma.vote.findMany({
    where: { votingRoundId },
    include: {
      location: { select: { name: true } },
      participant: { select: { name: true } },
    },
  });

  return NextResponse.json(votes);
}

// Helper to avoid circular imports
async function getAdminSession_proxy() {
  const { getAdminSession } = await import("@/lib/auth");
  return getAdminSession();
}
