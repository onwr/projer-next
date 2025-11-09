import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import { createActivityLog } from '@/lib/logger.js';

export async function POST(request, ctx) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const params = ctx.params?.then ? await ctx.params : ctx.params;
    const id = params?.id;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Withdrawal ID required' }, { status: 400 });
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!withdrawal) {
      return NextResponse.json({ ok: false, error: 'Withdrawal not found' }, { status: 404 });
    }

    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json({ ok: false, error: 'Withdrawal already processed' }, { status: 400 });
    }

    // Bakiye geri verme
    const amount = parseFloat(withdrawal.amount.toString());

    await prisma.balance.update({
      where: { userId: withdrawal.userId },
      data: {
        activeBalance: { increment: amount },
        pendingBalance: { decrement: amount },
      },
    });

    // Çekim talebini reddet
    const updated = await prisma.withdrawal.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    // Log kaydı
    createActivityLog({
      action: 'ADMIN_REJECT_WITHDRAWAL',
      entityType: 'Withdrawal',
      entityId: updated.id,
      userId: session.user.id,
      description: `Admin çekim talebini reddetti: ${updated.id} (Mağaza: ${withdrawal.user.storeName || withdrawal.user.email})`,
      request,
      metadata: { withdrawalId: updated.id, userId: withdrawal.userId, amount: withdrawal.amount, reason },
    }).catch(() => {}); // Non-blocking

    // TODO: Red sebebini kullanıcıya bildir (email)

    return NextResponse.json({ ok: true, withdrawal: updated });
  } catch (error) {
    console.error('[/api/admin/withdrawals/[id]/reject] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

