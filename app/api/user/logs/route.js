import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Eğer ayrı Log tablosu yoksa geçici boş liste döndür
    const logs = await prisma.loginLog
      ?.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, ip: true, status: true },
      })
      .catch(() => []);

    return NextResponse.json({ logs: logs || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


