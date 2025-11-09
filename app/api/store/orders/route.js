import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await auth();

    if (!session || session.user.userType !== 'STORE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = session.user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, COMPLETED, CANCELLED
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '20')));

    const where = {
      product: { authorId: storeId },
      ...(status && { status }),
    };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              title: true,
              category: true,
              coverImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const items = orders.map((order) => ({
      id: order.id,
      customer:
        order.user.firstName && order.user.lastName
          ? `${order.user.firstName} ${order.user.lastName}`
          : order.user.email,
      email: order.user.email,
      customerId: order.user.id,
      product: order.product.title,
      productId: order.product.id,
      category: order.product.category,
      amount: parseFloat(order.amount.toString()),
      status: order.status,
      date: order.createdAt.toISOString().split('T')[0],
      orderDate: order.createdAt.toISOString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }));

    return NextResponse.json({ ok: true, items, total, page, pageSize });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 200 }
    );
  }
}

