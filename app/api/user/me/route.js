import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    console.error('[/api/user/me] Error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}


