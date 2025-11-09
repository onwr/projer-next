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
    const userId = params?.userId;

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'User ID required' }, { status: 400 });
    }

    // Get balance
    const balance = await prisma.balance.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            storeName: true,
            profileImage: true,
          },
        },
      },
    });

    if (!balance) {
      return NextResponse.json({ ok: false, error: 'Balance not found' }, { status: 404 });
    }

    // Get exchange rate
    let exchangeRate = 35.0;
    try {
      const rateRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/exchange-rate`);
      if (rateRes.ok) {
        const rateData = await rateRes.json();
        if (rateData.ok && rateData.rate) {
          exchangeRate = rateData.rate;
        }
      }
    } catch {}

    // Get statistics
    const [orderStats, recentOrders, withdrawals] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        where: {
          product: { authorId: userId },
        },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.order.findMany({
        where: {
          product: { authorId: userId },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true,
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.withdrawal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const completedOrders = orderStats.find((s) => s.status === 'COMPLETED');
    const totalOrders = orderStats.reduce((sum, s) => sum + s._count.id, 0);
    const totalRevenue = orderStats.reduce((sum, s) => sum + parseFloat(s._sum.amount?.toString() || '0'), 0);
    const averageOrder = completedOrders?._count.id > 0 
      ? parseFloat(completedOrders._sum.amount?.toString() || '0') / completedOrders._count.id 
      : 0;

    const activeBalanceTL = parseFloat(balance.activeBalance.toString());
    const pendingBalanceTL = parseFloat(balance.pendingBalance.toString());
    const totalEarningsTL = parseFloat(balance.totalEarnings.toString());
    const totalWithdrawalsTL = parseFloat(balance.totalWithdrawals.toString());

    return NextResponse.json({
      ok: true,
      balance: {
        ...balance,
        activeBalance: activeBalanceTL,
        activeBalanceUSD: parseFloat((activeBalanceTL / exchangeRate).toFixed(2)),
        pendingBalance: pendingBalanceTL,
        pendingBalanceUSD: parseFloat((pendingBalanceTL / exchangeRate).toFixed(2)),
        totalEarnings: totalEarningsTL,
        totalEarningsUSD: parseFloat((totalEarningsTL / exchangeRate).toFixed(2)),
        totalWithdrawals: totalWithdrawalsTL,
        totalWithdrawalsUSD: parseFloat((totalWithdrawalsTL / exchangeRate).toFixed(2)),
      },
      statistics: {
        totalOrders,
        completedOrders: completedOrders?._count.id || 0,
        salesCount: completedOrders?._count.id || 0,
        totalRevenue,
        averageOrder,
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        amount: parseFloat(order.amount.toString()),
        status: order.status,
        createdAt: order.createdAt,
        user: order.user,
        product: order.product,
      })),
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
        amount: parseFloat(w.amount.toString()),
        amountUSD: parseFloat((parseFloat(w.amount.toString()) / exchangeRate).toFixed(2)),
        status: w.status,
        createdAt: w.createdAt,
      })),
    });
  } catch (error) {
    console.error('[/api/admin/balances/[userId]/details] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

