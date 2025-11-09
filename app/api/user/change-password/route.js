import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 200 });
    const { currentPassword, newPassword, confirmPassword } = await request
      .json()
      .catch(() => ({}));
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ ok: false, error: 'Eksik alanlar' }, { status: 200 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ ok: false, error: 'Şifreler eşleşmiyor' }, { status: 200 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ ok: false, error: 'Şifre en az 8 karakter' }, { status: 200 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.password)
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 200 });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid)
      return NextResponse.json({ ok: false, error: 'Mevcut şifre hatalı' }, { status: 200 });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}
