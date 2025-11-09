import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const yearAgo = new Date(today);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    // Kullanıcı İstatistikleri
    const [totalUsers, totalStores, totalAdmins] = await Promise.all([
      prisma.user.count({ where: { userType: 'USER' } }),
      prisma.user.count({ where: { userType: 'STORE' } }),
      prisma.user.count({ where: { userType: 'ADMIN' } }),
    ]);

    // Ürün İstatistikleri
    const [totalProducts, pendingProducts, approvedProducts, rejectedProducts] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: 'PENDING' } }),
      prisma.product.count({ where: { status: 'APPROVED' } }),
      prisma.product.count({ where: { status: 'REJECTED' } }),
    ]);

    // Sipariş İstatistikleri
    const [totalOrders, completedOrders, cancelledOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
    ]);

    // Gelir İstatistikleri
    const [
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      yearRevenue,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: today },
        },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: weekAgo },
        },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: monthAgo },
        },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: yearAgo },
        },
        _sum: { amount: true },
      }),
    ]);

    // Çekim Talepleri
    const pendingWithdrawals = await prisma.withdrawal.count({
      where: { status: 'PENDING' },
    });

    // Destek Talepleri
    const openSupportTickets = await prisma.supportTicket.count({
      where: { status: 'açık' },
    });

    // Aktif Mağazalar
    const activeStores = await prisma.user.count({
      where: {
        userType: 'STORE',
        products: {
          some: {
            status: 'APPROVED',
          },
        },
      },
    });

    // Son Aktiviteler
    const [recentOrders, recentUsers] = await Promise.all([
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          product: {
            select: {
              title: true,
              coverImage: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userType: true,
          createdAt: true,
        },
      }),
    ]);

    // En Çok Satan Ürünler (Top 10)
    const topSellingProducts = await prisma.order.groupBy({
      by: ['productId'],
      where: { status: 'COMPLETED' },
      _count: { productId: true },
      _sum: { amount: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 10,
    });

    const topSellingProductsWithDetails = await Promise.all(
      topSellingProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            title: true,
            coverImage: true,
            category: true,
          },
        });
        return {
          ...item,
          product,
          salesCount: item._count.productId,
          totalRevenue: parseFloat(item._sum.amount?.toString() || '0'),
        };
      })
    );

    // En Çok Kazanan Mağazalar (Top 10)
    const topStores = await prisma.order.groupBy({
      by: ['productId'],
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });

    const topStoresWithDetails = await Promise.all(
      topStores.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            author: {
              select: {
                id: true,
                storeName: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });
        return {
          store: product?.author,
          totalRevenue: parseFloat(item._sum.amount?.toString() || '0'),
        };
      })
    );

    // Kategori Dağılımı
    const categoryDistribution = await prisma.product.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    // Son 30 Gün Gelir Trendi
    const revenueTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + 1);

      const dayRevenue = await prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: dateStart,
            lt: dateEnd,
          },
        },
        _sum: { amount: true },
      });

      revenueTrend.push({
        date: dateStart.toISOString().split('T')[0],
        revenue: parseFloat(dayRevenue._sum.amount?.toString() || '0'),
      });
    }

    // Son 30 Gün Kullanıcı Büyümesi
    const userGrowth = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + 1);

      const dayUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: dateStart,
            lt: dateEnd,
          },
        },
      });

      userGrowth.push({
        date: dateStart.toISOString().split('T')[0],
        users: dayUsers,
      });
    }

    return NextResponse.json({
      ok: true,
      stats: {
        users: {
          total: totalUsers,
          stores: totalStores,
          admins: totalAdmins,
        },
        products: {
          total: totalProducts,
          pending: pendingProducts,
          approved: approvedProducts,
          rejected: rejectedProducts,
        },
        orders: {
          total: totalOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
        },
        revenue: {
          total: parseFloat(totalRevenue._sum.amount?.toString() || '0'),
          today: parseFloat(todayRevenue._sum.amount?.toString() || '0'),
          week: parseFloat(weekRevenue._sum.amount?.toString() || '0'),
          month: parseFloat(monthRevenue._sum.amount?.toString() || '0'),
          year: parseFloat(yearRevenue._sum.amount?.toString() || '0'),
        },
        pendingWithdrawals,
        openSupportTickets,
        activeStores,
      },
      recent: {
        orders: recentOrders.map((order) => ({
          id: order.id,
          amount: parseFloat(order.amount.toString()),
          status: order.status,
          createdAt: order.createdAt,
          user: {
            name: `${order.user.firstName} ${order.user.lastName}`,
            email: order.user.email,
          },
          product: {
            title: order.product.title,
            coverImage: order.product.coverImage,
          },
        })),
        users: recentUsers,
      },
      topSellingProducts: topSellingProductsWithDetails,
      topStores: topStoresWithDetails,
      categoryDistribution: categoryDistribution.map((item) => ({
        category: item.category,
        count: item._count.category,
      })),
      revenueTrend,
      userGrowth,
    });
  } catch (error) {
    console.error('[/api/admin/dashboard] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

