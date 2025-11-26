import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Tüm STORE kullanıcılarını al
    const stores = await prisma.user.findMany({
      where: { userType: 'STORE' },
      select: {
        id: true,
      },
    });

    const storeIds = stores.map((s) => s.id);

    // Toplam ürün sayısı (tüm STORE kullanıcılarının ürünleri)
    const totalProducts = await prisma.product.count({
      where: {
        authorId: { in: storeIds },
      },
    });

    // Toplam gelir (tüm STORE kullanıcılarının COMPLETED siparişleri)
    const revenueResult = await prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        product: {
          authorId: { in: storeIds },
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalRevenue = parseFloat(revenueResult._sum.amount?.toString() || '0');

    // Aktif mağazalar (en az bir APPROVED ürünü olan)
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

    // Aktif bakiyeler ve toplam kazançlar (tüm STORE kullanıcılarının bakiyeleri)
    const balances = await prisma.balance.findMany({
      where: {
        userId: { in: storeIds },
      },
      select: {
        activeBalance: true,
        totalEarnings: true,
      },
    });

    const totalActiveBalance = balances.reduce((sum, balance) => {
      return sum + parseFloat(balance.activeBalance.toString());
    }, 0);

    const totalEarningsSum = balances.reduce((sum, balance) => {
      return sum + parseFloat(balance.totalEarnings?.toString() || '0');
    }, 0);

    return NextResponse.json({
      ok: true,
      stats: {
        totalStores: stores.length,
        totalProducts,
        totalRevenue,
        activeStores,
        totalActiveBalance,
        totalEarnings: totalEarningsSum,
      },
    });
  } catch (error) {
    console.error('[/api/admin/stores/stats] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}


