import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import { createActivityLog } from '@/lib/logger.js';

export async function POST(request, ctx) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const params = ctx.params?.then ? await ctx.params : ctx.params;
    const id = params?.id;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Product ID required' }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { status: 'REJECTED' },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    // Log kaydı
    createActivityLog({
      action: 'ADMIN_REJECT_PRODUCT',
      entityType: 'Product',
      entityId: product.id,
      userId: session.user.id,
      description: `Admin ürün reddetti: ${product.title}`,
      request,
      metadata: { productId: product.id, title: product.title, reason },
    }).catch(() => {}); // Non-blocking

    return NextResponse.json({ ok: true, product });
  } catch (error) {
    console.error('[/api/admin/products/[id]/reject] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

