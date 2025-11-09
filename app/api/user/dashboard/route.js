import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;

    // Kullanıcı bilgilerini al (hesap yaşı için)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    // İstatistikleri hesapla
    const [
      totalModels,
      totalSpent,
      downloadedProducts,
      favoriteProductsCount,
    ] = await Promise.all([
      // Toplam model sayısı (benzersiz ürün sayısı)
      prisma.order.findMany({
        where: { userId, status: 'COMPLETED' },
        select: { productId: true },
        distinct: ['productId'],
      }).then((orders) => orders.length).catch(() => 0),

      // Toplam harcama
      prisma.order.aggregate({
        where: { userId, status: 'COMPLETED' },
        _sum: { amount: true },
      }).then((r) => {
        const sum = r._sum?.amount;
        return sum ? parseFloat(sum.toString()) : 0;
      }).catch(() => 0),

      // İndirilen ürün sayısı (downloads > 0 olan satın alınan ürünler)
      prisma.order.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      }).catch(() => 0),

      // Favori ürün sayısı (kullanıcının favorilerindeki ürün sayısı)
      prisma.userFavorite.count({
        where: {
          userId,
        },
      }).catch(() => 0),
    ]);

    // Hesap yaşını hesapla
    const accountAge = user?.createdAt
      ? (() => {
          const diff = Date.now() - new Date(user.createdAt).getTime();
          const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
          const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
          if (years > 0) return `${years} yıl`;
          if (months > 0) return `${months} ay`;
          return 'Yeni';
        })()
      : 'Bilinmiyor';

    // Son siparişler (detaylı)
    const recentOrders = await prisma.order
      .findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              category: true,
              coverImage: true,
              price: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
      .catch(() => []);

    // Son giriş (şimdilik createdAt kullanıyoruz, gerçek bir lastLogin field'ı yok)
    const lastLogin = user?.createdAt
      ? new Date(user.createdAt).toLocaleString('tr-TR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Bilinmiyor';

    return NextResponse.json({
      ok: true,
      stats: {
        totalModels,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        downloadedProducts,
        favoriteProductsCount,
        accountAge,
        lastLogin,
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        productId: order.productId,
        productTitle: order.product?.title || 'Ürün',
        productSlug: order.product?.slug || '',
        category: order.product?.category || '',
        coverImage: order.product?.coverImage || '/logo.svg',
        price: parseFloat(order.amount.toString()),
        status: order.status,
        date: new Date(order.createdAt).toLocaleDateString('tr-TR'),
        createdAt: order.createdAt,
      })),
    });
  } catch (e) {
    console.error('[/api/user/dashboard] Error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
