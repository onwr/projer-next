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
    const userId = params?.userId;
    const body = await request.json().catch(() => ({}));
    const { amount, operation, reason } = body; // operation: 'add' | 'subtract'

    if (!userId || !amount || !operation) {
      return NextResponse.json({ ok: false, error: 'User ID, amount and operation required' }, { status: 400 });
    }

    if (!['add', 'subtract'].includes(operation)) {
      return NextResponse.json({ ok: false, error: 'Invalid operation' }, { status: 400 });
    }

    const balance = await prisma.balance.findUnique({
      where: { userId },
    });

    if (!balance) {
      return NextResponse.json({ ok: false, error: 'Balance not found' }, { status: 404 });
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid amount' }, { status: 400 });
    }

    // Bakiye güncelleme
    const updateData = {
      activeBalance: operation === 'add' ? { increment: amountValue } : { decrement: amountValue },
    };

    if (operation === 'add') {
      updateData.totalEarnings = { increment: amountValue };
    }

    const updated = await prisma.balance.update({
      where: { userId },
      data: updateData,
    });

    // Log kaydı
    createActivityLog({
      action: 'ADMIN_UPDATE_BALANCE',
      entityType: 'Balance',
      entityId: updated.id,
      userId: session.user.id,
      description: `Admin bakiye güncelledi: ${operation === 'add' ? '+' : '-'}₺${amountValue.toFixed(2)} (Kullanıcı ID: ${userId})`,
      request,
      metadata: { balanceId: updated.id, userId, operation, amount: amountValue, reason },
    }).catch(() => {}); // Non-blocking

    return NextResponse.json({
      ok: true,
      balance: {
        id: updated.id,
        activeBalance: parseFloat(updated.activeBalance.toString()),
        totalEarnings: parseFloat(updated.totalEarnings.toString()),
      },
    });
  } catch (error) {
    console.error('[/api/admin/balances/[userId]/update] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

