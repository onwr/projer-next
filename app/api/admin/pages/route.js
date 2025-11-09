import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  try {
    const session = await auth();

    if (!session || session.user.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where = type ? { type } : {};

    const pages = await prisma.page.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ ok: true, pages });
  } catch (error) {
    console.error('[/api/admin/pages] Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Sayfalar yüklenemedi' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session || session.user.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { slug, title, content, type, isActive = true } = data;

    if (!slug || !title || !content || !type) {
      return NextResponse.json(
        { ok: false, error: 'Slug, title, content ve type gereklidir' },
        { status: 400 }
      );
    }

    const page = await prisma.page.create({
      data: {
        slug,
        title,
        content,
        type,
        isActive,
      },
    });

    return NextResponse.json({ ok: true, page });
  } catch (error) {
    console.error('[/api/admin/pages] Error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { ok: false, error: 'Bu slug zaten kullanılıyor' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: error.message || 'Sayfa oluşturulamadı' },
      { status: 500 }
    );
  }
}

