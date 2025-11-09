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

export async function GET(request) {
  try {
    const categories = await prisma.category.findMany({
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

    // Ürün sayılarını hesapla
    const productsByCategory = await prisma.product.groupBy({
      by: ['category'],
      where: {
        status: 'APPROVED',
      },
      _count: {
        id: true,
      },
    });

    const categoryCountMap = {};
    productsByCategory.forEach((item) => {
      categoryCountMap[item.category] = item._count.id;
    });

    // Kategorilere ürün sayısını ekle
    const categoriesWithCounts = categories.map((cat) => ({
      ...cat,
      productCount: categoryCountMap[cat.name] || 0,
    }));

    // Hierarchical yapıyı oluştur
    const tree = buildCategoryTree(categoriesWithCounts);

    return NextResponse.json({
      ok: true,
      categories: tree,
      flat: categoriesWithCounts,
    });
  } catch (error) {
    console.error('[/api/categories] Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Kategoriler yüklenemedi' },
      { status: 500 }
    );
  }
}

