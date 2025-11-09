import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request, ctx) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ ok: false, purchased: false }, { status: 200 });
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
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    // Kullanıcının bu ürünü satın alıp almadığını kontrol et
    const order = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        productId: product.id,
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({
      ok: true,
      purchased: !!order,
      productId: product.id,
    });
  } catch (error) {
    console.error('[/api/products/[id]/purchased] Error:', error);
    return NextResponse.json({ ok: false, purchased: false, error: error.message }, { status: 200 });
  }
}

