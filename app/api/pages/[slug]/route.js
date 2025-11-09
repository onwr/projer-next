import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    const page = await prisma.page.findUnique({
      where: { slug },
    });

    if (!page) {
      return NextResponse.json(
        { ok: false, error: 'Sayfa bulunamadı' },
        { status: 404 }
      );
    }

    if (!page.isActive) {
      return NextResponse.json(
        { ok: false, error: 'Sayfa aktif değil' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, page });
  } catch (error) {
    console.error('[/api/pages/[slug]] Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Sayfa yüklenemedi' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { slug } = await params;
    const data = await request.json();
    const { title, content, type, isActive } = data;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (isActive !== undefined) updateData.isActive = isActive;

    const page = await prisma.page.update({
      where: { slug },
      data: updateData,
    });

    return NextResponse.json({ ok: true, page });
  } catch (error) {
    console.error('[/api/pages/[slug]] Error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { ok: false, error: 'Sayfa bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: false, error: error.message || 'Sayfa güncellenemedi' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { slug } = await params;

    await prisma.page.delete({
      where: { slug },
    });

    return NextResponse.json({ ok: true, message: 'Sayfa silindi' });
  } catch (error) {
    console.error('[/api/pages/[slug]] Error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { ok: false, error: 'Sayfa bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: false, error: error.message || 'Sayfa silinemedi' },
      { status: 500 }
    );
  }
}

