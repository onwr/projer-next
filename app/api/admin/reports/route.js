import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'revenue'; // revenue, users, products, orders, stores
    const period = searchParams.get('period') || 'month'; // day, week, month, year
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const now = new Date();
    let dateStart, dateEnd;

    if (startDate && endDate) {
      dateStart = new Date(startDate);
      dateEnd = new Date(endDate);
      dateEnd.setHours(23, 59, 59, 999);
    } else {
      switch (period) {
        case 'day':
          dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          dateEnd = new Date(dateStart);
          dateEnd.setDate(dateEnd.getDate() + 1);
          break;
        case 'week':
          dateStart = new Date(now);
          dateStart.setDate(dateStart.getDate() - 7);
          dateEnd = new Date(now);
          break;
        case 'month':
          dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'year':
          dateStart = new Date(now.getFullYear(), 0, 1);
          dateEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        default:
          dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
    }

    let report = {};

    switch (type) {
      case 'revenue': {
        const revenue = await prisma.order.aggregate({
          where: {
            status: 'COMPLETED',
            createdAt: { gte: dateStart, lte: dateEnd },
          },
          _sum: { amount: true },
          _count: { id: true },
          _avg: { amount: true },
        });

        // Günlük breakdown
        const dailyBreakdown = [];
        const currentDate = new Date(dateStart);
        while (currentDate <= dateEnd) {
          const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayEnd.getDate() + 1);

          const dayRevenue = await prisma.order.aggregate({
            where: {
              status: 'COMPLETED',
              createdAt: { gte: dayStart, lt: dayEnd },
            },
            _sum: { amount: true },
            _count: { id: true },
          });

          dailyBreakdown.push({
            date: dayStart.toISOString().split('T')[0],
            revenue: parseFloat(dayRevenue._sum.amount?.toString() || '0'),
            orders: dayRevenue._count.id,
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        report = {
          type: 'revenue',
          period: {
            start: dateStart.toISOString(),
            end: dateEnd.toISOString(),
          },
          summary: {
            totalRevenue: parseFloat(revenue._sum.amount?.toString() || '0'),
            totalOrders: revenue._count.id,
            averageOrder: parseFloat(revenue._avg.amount?.toString() || '0'),
          },
          breakdown: dailyBreakdown,
        };
        break;
      }

      case 'users': {
        const newUsers = await prisma.user.count({
          where: {
            createdAt: { gte: dateStart, lte: dateEnd },
          },
        });

        const usersByType = await prisma.user.groupBy({
          by: ['userType'],
          where: {
            createdAt: { gte: dateStart, lte: dateEnd },
          },
          _count: { id: true },
        });

        report = {
          type: 'users',
          period: {
            start: dateStart.toISOString(),
            end: dateEnd.toISOString(),
          },
          summary: {
            totalNewUsers: newUsers,
            byType: usersByType.reduce((acc, item) => {
              acc[item.userType] = item._count.id;
              return acc;
            }, {}),
          },
        };
        break;
      }

      case 'products': {
        const newProducts = await prisma.product.count({
          where: {
            createdAt: { gte: dateStart, lte: dateEnd },
          },
        });

        const productsByStatus = await prisma.product.groupBy({
          by: ['status'],
          where: {
            createdAt: { gte: dateStart, lte: dateEnd },
          },
          _count: { id: true },
        });

        const topProducts = await prisma.product.findMany({
          where: {
            createdAt: { gte: dateStart, lte: dateEnd },
          },
          orderBy: { views: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            views: true,
            downloads: true,
            likes: true,
            category: true,
          },
        });

        report = {
          type: 'products',
          period: {
            start: dateStart.toISOString(),
            end: dateEnd.toISOString(),
          },
          summary: {
            totalNewProducts: newProducts,
            byStatus: productsByStatus.reduce((acc, item) => {
              acc[item.status] = item._count.id;
              return acc;
            }, {}),
            topProducts: topProducts.map((p) => ({
              id: p.id,
              title: p.title,
              views: p.views,
              downloads: p.downloads,
              likes: p.likes,
              category: p.category,
            })),
          },
        };
        break;
      }

      case 'orders': {
        const ordersByStatus = await prisma.order.groupBy({
          by: ['status'],
          where: {
            createdAt: { gte: dateStart, lte: dateEnd },
          },
          _count: { id: true },
          _sum: { amount: true },
        });

        report = {
          type: 'orders',
          period: {
            start: dateStart.toISOString(),
            end: dateEnd.toISOString(),
          },
          summary: {
            byStatus: ordersByStatus.map((item) => ({
              status: item.status,
              count: item._count.id,
              totalAmount: parseFloat(item._sum.amount?.toString() || '0'),
            })),
          },
        };
        break;
      }

      case 'stores': {
        const topStores = await prisma.order.groupBy({
          by: ['productId'],
          where: {
            status: 'COMPLETED',
            createdAt: { gte: dateStart, lte: dateEnd },
          },
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
              revenue: parseFloat(item._sum.amount?.toString() || '0'),
            };
          })
        );

        report = {
          type: 'stores',
          period: {
            start: dateStart.toISOString(),
            end: dateEnd.toISOString(),
          },
          summary: {
            topStores: topStoresWithDetails,
          },
        };
        break;
      }

      default:
        return NextResponse.json({ ok: false, error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, report });
  } catch (error) {
    console.error('[/api/admin/reports] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

