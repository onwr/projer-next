import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.userType !== 'STORE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = session.user.id;

    // Tarih hesaplamaları
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // İstatistikler
    const [
      totalProducts,
      storeProducts,
      totalSales,
      totalRevenue,
      pendingOrders,
      totalViews,
      totalDownloads,
      balance,
      pendingWithdrawals,
      monthlyRevenue,
      weeklyRevenue,
      recentOrders,
    ] = await Promise.all([
      // Toplam ürün sayısı
      prisma.product.count({ where: { authorId: storeId } }),

      // Ürünler (aggregate için)
      prisma.product.findMany({
        where: { authorId: storeId },
        select: { views: true, downloads: true },
      }),

      // Toplam satış sayısı (COMPLETED)
      prisma.order.count({
        where: {
          status: 'COMPLETED',
          product: { authorId: storeId },
        },
      }),

      // Toplam gelir (COMPLETED orders)
      prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          product: { authorId: storeId },
        },
        _sum: { amount: true },
      }),

      // Bekleyen siparişler
      prisma.order.count({
        where: {
          status: 'PENDING',
          product: { authorId: storeId },
        },
      }),

      // Toplam görüntülenme (aggregate)
      Promise.resolve(0),

      // Toplam indirme (aggregate)
      Promise.resolve(0),

      // Bakiye
      prisma.balance.findUnique({ where: { userId: storeId } }),

      // Bekleyen çekimler
      prisma.withdrawal.aggregate({
        where: {
          userId: storeId,
          status: 'PENDING',
        },
        _sum: { amount: true },
      }),

      // Aylık gelir
      prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          product: { authorId: storeId },
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),

      // Haftalık gelir
      prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          product: { authorId: storeId },
          createdAt: { gte: startOfWeek },
        },
        _sum: { amount: true },
      }),

      // Son siparişler
      prisma.order.findMany({
        where: {
          status: 'COMPLETED',
          product: { authorId: storeId },
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
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Views ve Downloads toplamı
    const viewsSum = storeProducts.reduce((acc, p) => acc + (p.views || 0), 0);
    const downloadsSum = storeProducts.reduce((acc, p) => acc + (p.downloads || 0), 0);

    const stats = {
      totalProducts,
      totalSales,
      totalRevenue: parseFloat((totalRevenue._sum.amount || 0).toString()),
      pendingOrders,
      totalViews: viewsSum,
      totalDownloads: downloadsSum,
      activeBalance: balance
        ? parseFloat(balance.activeBalance.toString())
        : 0,
      pendingWithdrawals: parseFloat(
        (pendingWithdrawals._sum.amount || 0).toString()
      ),
      monthlyRevenue: parseFloat((monthlyRevenue._sum.amount || 0).toString()),
      weeklyRevenue: parseFloat((weeklyRevenue._sum.amount || 0).toString()),
    };

    const orders = recentOrders.map((order) => ({
      id: order.id,
      customer:
        order.user.firstName && order.user.lastName
          ? `${order.user.firstName} ${order.user.lastName}`
          : order.user.email,
      email: order.user.email,
      product: order.product.title,
      amount: parseFloat(order.amount.toString()),
      status: order.status,
      date: order.createdAt.toISOString().split('T')[0],
      orderDate: order.createdAt.toISOString(),
      createdAt: order.createdAt.toISOString(),
      category: order.product.category,
      productId: order.product.id,
    }));

    return NextResponse.json({ ok: true, stats, recentOrders: orders });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 200 }
    );
  }
}

