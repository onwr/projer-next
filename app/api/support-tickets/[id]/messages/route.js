import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function POST(request, ctx) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 200 });
    // Next 16: params bir Promise olabilir
    const p = ctx?.params?.then ? await ctx.params : ctx?.params;
    const id = p?.id;
    if (!id) return NextResponse.json({ ok: false, error: 'Geçersiz id' }, { status: 200 });
    const data = await request.json().catch(() => ({}));
    if (!data?.message)
      return NextResponse.json({ ok: false, error: 'Mesaj gerekli' }, { status: 200 });

    const owner = await prisma.supportTicket.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!owner) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 200 });

    const msg = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        userId: session.user.id,
        sender: 'user',
        message: data.message,
      },
      select: { id: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, id: msg.id, createdAt: msg.createdAt }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}
