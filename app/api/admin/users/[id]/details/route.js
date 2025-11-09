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
    const { id } = params || {};

    if (!id) {
      return NextResponse.json({ ok: false, error: 'User ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        storeName: true,
        storeDescription: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    const [balance, products, orders, withdrawals] = await Promise.all([
      prisma.balance.findUnique({
        where: { userId: id },
      }),
      prisma.product.findMany({
        where: { authorId: id },
        select: {
          id: true,
          status: true,
        },
      }),
      prisma.order.findMany({
        where: {
          product: { authorId: id },
        },
        select: {
          id: true,
          status: true,
          amount: true,
          createdAt: true,
          product: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.withdrawal.findMany({
        where: { userId: id },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const productStats = {
      total: products.length,
      active: products.filter((p) => p.status === 'APPROVED').length,
      passive: products.filter((p) => p.status !== 'APPROVED').length,
    };

    const orderStats = {
      total: orders.length,
      completed: orders.filter((o) => o.status === 'COMPLETED').length,
      cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
    };

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      product: order.product,
      amount: parseFloat(order.amount.toString()),
      status: order.status,
      createdAt: order.createdAt,
    }));

    const formattedWithdrawals = withdrawals.map((w) => ({
      id: w.id,
      amount: parseFloat(w.amount.toString()),
      amountUSD: parseFloat(w.amount.toString()) / 35,
      status: w.status,
      createdAt: w.createdAt,
    }));

    return NextResponse.json({
      ok: true,
      ...user,
      balance: balance
        ? {
            activeBalance: parseFloat(balance.activeBalance.toString()),
            pendingBalance: parseFloat(balance.pendingBalance.toString()),
            totalEarnings: parseFloat(balance.totalEarnings.toString()),
            totalWithdrawals: parseFloat(balance.totalWithdrawals.toString()),
          }
        : null,
      productStats,
      orderStats,
      recentOrders: formattedOrders,
      withdrawals: formattedWithdrawals,
    });
  } catch (error) {
    console.error('[/api/admin/users/[id]/details] Error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Detaylar yüklenemedi' }, { status: 500 });
  }
}

