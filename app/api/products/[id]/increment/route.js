import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request, ctx) {
  try {
    const { id } = await ctx.params;
    const body = await request.json().catch(() => ({}));
    const { field, increment = true } = body; // 'views', 'downloads', 'likes' ve increment (true/false)

    if (!['views', 'downloads', 'likes'].includes(field)) {
      return NextResponse.json({ ok: false, error: 'Invalid field' }, { status: 400 });
    }

    // Önce slug ile ara, bulunamazsa id ile ara
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

    // Increment veya decrement işlemi
    const currentValue = product[field] || 0;
    const newValue = increment ? currentValue + 1 : Math.max(0, currentValue - 1);

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        [field]: newValue,
      },
    });

    return NextResponse.json({ ok: true, [field]: updated[field] }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err?.message || 'Error' }, { status: 200 });
  }
}

