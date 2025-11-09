import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';

const buildCategoryTree = (categories, parentId = null) => {
  return categories
    .filter((cat) => cat.parentId === parentId)
    .map((cat) => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id),
    }));
};

export async function GET(request, ctx) {
  try {
    const params = ctx.params?.then ? await ctx.params : ctx.params;
    const { slug } = params || {};

    if (!slug) {
      return NextResponse.json({ ok: false, error: 'Slug gerekli' }, { status: 400 });
    }

    // Slug'a göre kategoriyi bul
    const category = await prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        parentId: true,
      },
    });

    if (!category) {
      return NextResponse.json({ ok: false, error: 'Kategori bulunamadı' }, { status: 404 });
    }

    // Tüm kategorileri al (hierarchical yapı için)
    const allCategories = await prisma.category.findMany({
      orderBy: [
        { parentId: 'asc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        parentId: true,
      },
    });

    // Bu kategorinin alt kategorilerini bul
    const childCategories = allCategories.filter((cat) => cat.parentId === category.id);

    // Ürün sayısını hesapla
    const productCount = await prisma.product.count({
      where: {
        category: category.name,
        status: 'APPROVED',
      },
    });

    // Alt kategorilerin ürün sayılarını da hesapla
    const childProductCounts = await Promise.all(
      childCategories.map(async (child) => {
        const count = await prisma.product.count({
          where: {
            category: child.name,
            status: 'APPROVED',
          },
        });
        return { ...child, productCount: count };
      })
    );

    // Eğer bu bir parent kategori ise, tüm alt kategorilerin ürün sayılarını topla
    let totalProductCount = productCount;
    childProductCounts.forEach((child) => {
      totalProductCount += child.productCount;
    });

    return NextResponse.json({
      ok: true,
      category: {
        ...category,
        productCount,
        totalProductCount: totalProductCount,
      },
      children: childProductCounts,
    });
  } catch (error) {
    console.error('[/api/categories/[slug]] Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Kategori yüklenemedi' },
      { status: 500 }
    );
  }
}

