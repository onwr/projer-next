import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(_req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params.id;
    const ticket = await prisma.supportTicket.findFirst({
      where: { id, userId: session.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ticket });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params.id;
    const data = await request.json();
    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: data.status ?? undefined,
        priority: data.priority ?? undefined,
      },
      select: { id: true, status: true, priority: true },
    });
    return NextResponse.json({ ticket: updated });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


