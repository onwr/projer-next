import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import { createActivityLog } from '@/lib/logger.js';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, merchantOid } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'Sepet boş' }, { status: 400 });
    }

    const orders = [];
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const orderIdPrefix = `order${timestamp}${randomStr}`;

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
      });

      if (!product) {
        continue;
      }

      const orderId = `${orderIdPrefix}${orders.length}`;
      const order = await prisma.order.create({
        data: {
          id: orderId,
          userId: session.user.id,
          productId: product.id,
          amount: parseFloat(item.price) * item.quantity,
          status: 'COMPLETED',
        },
      });

      orders.push(order);

      // Log kaydı (her sipariş için)
      createActivityLog({
        action: 'ORDER_CREATE',
        entityType: 'Order',
        entityId: order.id,
        userId: session.user.id,
        description: `Sipariş oluşturuldu: ${order.id} (Ürün: ${product.title})`,
        request,
        metadata: { orderId: order.id, productId: product.id, amount: order.amount, merchantOid },
      }).catch(() => {}); // Non-blocking
    }

    return NextResponse.json({
      ok: true,
      orders: orders.map((o) => ({
        id: o.id,
        productId: o.productId,
        amount: parseFloat(o.amount.toString()),
        status: o.status,
      })),
      orderIdPrefix,
    });
  } catch (error) {
    console.error('[/api/orders/create] Error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Sipariş oluşturulamadı' }, { status: 500 });
  }
}

