import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 200 });
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        storeName: true,
        storeDescription: true,
        profileImage: true,
      },
    });
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 200 });
    const body = await request.json().catch(() => ({}));
    const { email, firstName, lastName, phone, storeName, storeDescription, profileImage } = body || {};

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ ok: false, error: 'Zorunlu alanlar eksik' }, { status: 200 });
    }

    // Email değişiyorsa benzersizlik kontrolü
    const current = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!current) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 200 });
    if (email !== current.email) {
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) return NextResponse.json({ ok: false, error: 'Email kullanımda' }, { status: 200 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email,
        firstName,
        lastName,
        phone: phone ?? null,
        storeName: storeName ?? null,
        storeDescription: storeDescription ?? null,
        profileImage: profileImage ?? null,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: updated.id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}


