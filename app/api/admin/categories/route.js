import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

const toSlug = (str = '') =>
  String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

const buildCategoryTree = (categories, parentId = null) => {
  return categories
    .filter((cat) => cat.parentId === parentId)
    .map((cat) => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id),
      childrenCount: categories.filter((c) => c.parentId === cat.id).length,
      productsCount: 0,
    }));
};

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });

    const productsByCategory = await prisma.product.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });

    const categoryMap = {};
    productsByCategory.forEach((item) => {
      categoryMap[item.category] = item._count.id;
    });

    const categoriesWithCounts = categories.map((cat) => ({
      ...cat,
      productsCount: categoryMap[cat.name] || 0,
    }));

    const tree = buildCategoryTree(categoriesWithCounts);

    return NextResponse.json({
      ok: true,
      categories: tree,
      flat: categoriesWithCounts,
    });
  } catch (error) {
    console.error('[/api/admin/categories] GET Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Kategoriler yüklenemedi' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, image, parentId } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ ok: false, error: 'Kategori adı gerekli' }, { status: 400 });
    }

    const slug = toSlug(name);

    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name: name.trim() }, { slug }],
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { ok: false, error: 'Bu kategori adı veya slug zaten kullanılıyor' },
        { status: 400 }
      );
    }

    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return NextResponse.json({ ok: false, error: 'Üst kategori bulunamadı' }, { status: 400 });
      }
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        image: image || null,
        parentId: parentId || null,
      },
    });

    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (error) {
    console.error('[/api/admin/categories] POST Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Kategori oluşturulamadı' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, image, parentId } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Kategori ID gerekli' }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json({ ok: false, error: 'Kategori bulunamadı' }, { status: 404 });
    }

    const updateData = {};

    if (name && name.trim() !== '') {
      const slug = toSlug(name);
      const existingCategory = await prisma.category.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [{ name: name.trim() }, { slug }],
            },
          ],
        },
      });

      if (existingCategory) {
        return NextResponse.json(
          { ok: false, error: 'Bu kategori adı veya slug zaten kullanılıyor' },
          { status: 400 }
        );
      }

      updateData.name = name.trim();
      updateData.slug = slug;
    }

    if (image !== undefined) {
      updateData.image = image || null;
    }

    if (parentId !== undefined) {
      if (parentId === id) {
        return NextResponse.json(
          { ok: false, error: 'Kategori kendi alt kategorisi olamaz' },
          { status: 400 }
        );
      }

      if (parentId) {
        const parent = await prisma.category.findUnique({
          where: { id: parentId },
        });
        if (!parent) {
          return NextResponse.json(
            { ok: false, error: 'Üst kategori bulunamadı' },
            { status: 400 }
          );
        }

        const isDescendant = await prisma.category.findFirst({
          where: {
            parentId: id,
            id: parentId,
          },
        });

        if (isDescendant) {
          return NextResponse.json(
            { ok: false, error: 'Alt kategori üst kategori olamaz' },
            { status: 400 }
          );
        }
      }

      updateData.parentId = parentId || null;
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, category: updatedCategory });
  } catch (error) {
    console.error('[/api/admin/categories] PUT Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Kategori güncellenemedi' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Kategori ID gerekli' }, { status: 400 });
    }

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

    const productsWithCategory = await prisma.product.count({
      where: {
        category: category.name,
      },
    });

    if (productsWithCategory > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Bu kategoriye ait ${productsWithCategory} ürün bulunuyor. Kategori silinemez.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, message: 'Kategori silindi' });
  } catch (error) {
    console.error('[/api/admin/categories] DELETE Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Kategori silinemedi' },
      { status: 500 }
    );
  }
}

