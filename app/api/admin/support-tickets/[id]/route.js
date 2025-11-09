import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request, ctx) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const params = ctx.params?.then ? await ctx.params : ctx.params;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Ticket ID required' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            storeName: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ ok: false, error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    console.error('[/api/admin/support-tickets/[id]] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, ctx) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const params = ctx.params?.then ? await ctx.params : ctx.params;
    const id = params?.id;
    const body = await request.json().catch(() => ({}));

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: body.status ?? undefined,
        priority: body.priority ?? undefined,
        category: body.category ?? undefined,
      },
      select: {
        id: true,
        status: true,
        priority: true,
        category: true,
      },
    });

    return NextResponse.json({ ok: true, ticket: updated });
  } catch (error) {
    console.error('[/api/admin/support-tickets/[id] PATCH] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

