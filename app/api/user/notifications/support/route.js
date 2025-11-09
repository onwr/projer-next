import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notifications = await prisma.supportNotification
      ?.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, message: true, createdAt: true },
      })
      .catch(() => []);

    return NextResponse.json({ notifications: notifications || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


