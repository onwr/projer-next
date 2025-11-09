import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ ok: false, error: 'Kategori bulunamadı' }, { status: 404 });
    }

    const productsCount = await prisma.product.count({
      where: {
        category: category.name,
      },
    });

    return NextResponse.json({
      ok: true,
      category: {
        ...category,
        productsCount,
      },
    });
  } catch (error) {
    console.error('[/api/admin/categories/[id]] GET Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Kategori yüklenemedi' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json({ ok: false, error: 'Kategori bulunamadı' }, { status: 404 });
    }

    const updateData = {};

    if (body.name) {
      updateData.name = body.name.trim();
    }

    if (body.image !== undefined) {
      updateData.image = body.image || null;
    }

    if (body.parentId !== undefined) {
      updateData.parentId = body.parentId || null;
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, category: updatedCategory });
  } catch (error) {
    console.error('[/api/admin/categories/[id]] PUT Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Kategori güncellenemedi' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!category) {
      return NextResponse.json({ ok: false, error: 'Kategori bulunamadı' }, { status: 404 });
    }

    if (category.children.length > 0) {
      return NextResponse.json(
        { ok: false, error: 'Alt kategorisi olan kategoriler silinemez' },
        { status: 400 }
      );
    }

    const productsCount = await prisma.product.count({
      where: {
        category: category.name,
      },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Bu kategoriye ait ${productsCount} ürün bulunuyor. Kategori silinemez.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, message: 'Kategori silindi' });
  } catch (error) {
    console.error('[/api/admin/categories/[id]] DELETE Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Kategori silinemedi' },
      { status: 500 }
    );
  }
}

