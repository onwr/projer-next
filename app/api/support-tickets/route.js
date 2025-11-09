import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || '1');
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: { id: true, subject: true, category: true, priority: true, status: true, createdAt: true, updatedAt: true },
      }),
      prisma.supportTicket.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({ items, total, page, limit });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const form = await request.formData().catch(() => null);
    const body = form
      ? {
          subject: form.get('subject'),
          category: form.get('category'),
          priority: form.get('priority') || 'Orta',
          description: form.get('description'),
        }
      : await request.json();

    if (!body?.subject || !body?.category || !body?.description) {
      return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject: body.subject,
        category: body.category,
        priority: body.priority || 'Orta',
        status: 'açık',
        messages: {
          create: {
            userId: session.user.id,
            sender: 'user',
            message: body.description,
          },
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ id: ticket.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


