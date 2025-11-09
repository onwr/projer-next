import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function POST(request, ctx) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const params = ctx.params?.then ? await ctx.params : ctx.params;
    const id = params?.id;
    const body = await request.json().catch(() => ({}));
    const { message } = body;

    if (!id || !message) {
      return NextResponse.json({ ok: false, error: 'Ticket ID and message required' }, { status: 400 });
    }

    // Admin mesajı ekle
    const supportMessage = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        userId: null, // Admin mesajı
        sender: 'support',
        message,
      },
      select: {
        id: true,
        message: true,
        sender: true,
        createdAt: true,
      },
    });

    // Ticket'ı güncelle
    await prisma.supportTicket.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true, message: supportMessage });
  } catch (error) {
    console.error('[/api/admin/support-tickets/[id]/messages] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

