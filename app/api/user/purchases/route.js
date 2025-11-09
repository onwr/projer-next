import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // COMPLETED, PENDING, CANCELLED
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : undefined;

    const where = {
      userId: session.user.id,
      ...(status && { status }),
    };

    const allOrders = await prisma.order.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            subcategory: true,
            coverImage: true,
            price: true,
            productFiles: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Her productId için sadece bir Order (en son satın alınan) göster
    const uniqueProductMap = new Map();
    allOrders.forEach((order) => {
      if (!uniqueProductMap.has(order.productId)) {
        uniqueProductMap.set(order.productId, order);
      }
    });

    // Limit uygula
    const purchases = limit
      ? Array.from(uniqueProductMap.values()).slice(0, limit)
      : Array.from(uniqueProductMap.values());

    return NextResponse.json({
      ok: true,
      purchases: purchases.map((order) => {
        const safeParse = (str) => {
          if (!str) return [];
          try {
            return typeof str === 'string' ? JSON.parse(str) : str;
          } catch {
            return [];
          }
        };

        return {
          id: order.id,
          orderId: order.id,
          productId: order.productId,
          productTitle: order.product?.title || 'Ürün',
          productSlug: order.product?.slug || '',
          category: order.product?.category || '',
          subcategory: order.product?.subcategory || '',
          coverImage: order.product?.coverImage || '/logo.svg',
          description: order.product?.description || '',
          price: parseFloat(order.amount.toString()),
          productPrice: parseFloat(order.product?.price?.toString() || '0'),
          status: order.status,
          date: new Date(order.createdAt).toLocaleDateString('tr-TR'),
          downloadDate: new Date(order.createdAt).toLocaleString('tr-TR'),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          productFiles: safeParse(order.product?.productFiles || '[]'),
        };
      }),
    });
  } catch (e) {
    console.error('[/api/user/purchases] Error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
