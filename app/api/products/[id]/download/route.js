import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function POST(request, ctx) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await ctx.params;

    // Ürünü bul (slug veya id ile)
    let product = await prisma.product.findUnique({
      where: { slug: id },
    });

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id },
      });
    }

    if (!product) {
      return NextResponse.json({ ok: false, error: 'Ürün bulunamadı' }, { status: 404 });
    }

    // Kullanıcının bu ürünü satın alıp almadığını kontrol et
    const order = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        productId: product.id,
        status: 'COMPLETED',
      },
    });

    // Ücretsiz ürünler veya satın alınmış ürünler indirilebilir
    const isFree = product.isFree || parseFloat(product.price.toString()) <= 0;
    const hasPurchased = !!order;

    if (!isFree && !hasPurchased) {
      return NextResponse.json({ ok: false, error: 'Bu ürünü satın almadınız' }, { status: 403 });
    }

    // Ücretsiz ürünler için otomatik Order oluştur (eğer yoksa)
    if (isFree && !hasPurchased) {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const orderId = `free${timestamp}${randomStr}`;
      
      await prisma.order.create({
        data: {
          id: orderId,
          userId: session.user.id,
          productId: product.id,
          amount: 0,
          status: 'COMPLETED',
        },
      });
    }

    // Downloads sayacını artır
    await prisma.product.update({
      where: { id: product.id },
      data: {
        downloads: {
          increment: 1,
        },
      },
    });

    // Ürün dosyalarını parse et
    const safeParse = (str) => {
      if (!str) return [];
      try {
        return typeof str === 'string' ? JSON.parse(str) : str;
      } catch {
        return [];
      }
    };

    const productFiles = safeParse(product.productFiles || '[]');

    return NextResponse.json({
      ok: true,
      productId: product.id,
      productTitle: product.title,
      files: productFiles,
    });
  } catch (error) {
    console.error('[/api/products/[id]/download] Error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'İndirme hatası' }, { status: 500 });
  }
}

