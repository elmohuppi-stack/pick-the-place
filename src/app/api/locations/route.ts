import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { verifyParticipantToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const token = searchParams.get("token");

  // Admin access
  const admin = await getAdminSession();

  // Participant access via token
  const participant = token ? await verifyParticipantToken(token) : null;

  if (!admin && !participant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const effectiveEventId = eventId || participant?.eventId;

  if (!effectiveEventId) {
    return NextResponse.json(
      { error: "eventId erforderlich" },
      { status: 400 },
    );
  }

  const locations = await prisma.location.findMany({
    where: {
      eventId: effectiveEventId,
      // For non-admin access, hide opt-out markers
      ...(admin ? {} : { name: { not: "__optout__" } }),
    },
    include: {
      proposedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(locations);
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const participant = token ? await verifyParticipantToken(token) : null;
  if (!participant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (participant.event.status !== "proposal") {
    return NextResponse.json(
      { error: "Vorschlagsphase ist nicht aktiv" },
      { status: 400 },
    );
  }

  const { name, description } = await request.json();

  if (!name) {
    return NextResponse.json({ error: "Name erforderlich" }, { status: 400 });
  }

  // Check if participant already proposed
  const existing = await prisma.location.findFirst({
    where: { eventId: participant.eventId, proposedById: participant.id },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Du hast bereits einen Ort vorgeschlagen" },
      { status: 409 },
    );
  }

  const location = await prisma.location.create({
    data: {
      eventId: participant.eventId,
      name,
      description,
      proposedById: participant.id,
    },
  });

  return NextResponse.json(location, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id erforderlich" }, { status: 400 });
  }

  const { isActive } = await request.json();

  const location = await prisma.location.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json(location);
}
