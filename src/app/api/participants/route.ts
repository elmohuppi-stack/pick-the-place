import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { generateAuthToken } from "@/lib/utils";

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

  const participants = await prisma.participant.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(participants);
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId, name, email } = await request.json();

  if (!eventId || !name || !email) {
    return NextResponse.json(
      { error: "eventId, name und email erforderlich" },
      { status: 400 },
    );
  }

  const existing = await prisma.participant.findUnique({
    where: { eventId_email: { eventId, email } },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Teilnehmer mit dieser E-Mail existiert bereits" },
      { status: 409 },
    );
  }

  const participant = await prisma.participant.create({
    data: {
      eventId,
      name,
      email,
      authToken: generateAuthToken(),
    },
  });

  return NextResponse.json(participant, { status: 201 });
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

  const { isActive } = await request.json();

  if (typeof isActive !== "boolean") {
    return NextResponse.json(
      { error: "isActive (boolean) erforderlich" },
      { status: 400 },
    );
  }

  const participant = await prisma.participant.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json(participant);
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id erforderlich" }, { status: 400 });
  }

  await prisma.participant.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
