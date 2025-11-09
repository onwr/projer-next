import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const authorId = searchParams.get('authorId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * pageSize;

    const where = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }
    if (category) {
      where.category = category;
    }
    if (authorId) {
      where.authorId = authorId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              storeName: true,
              email: true,
            },
          },
          _count: {
            select: {
              orders: true,
              favorites: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // JSON alanları parse et
    const productsParsed = products.map((product) => {
      let tags = [];
      let features = [];
      let mediaImages = [];
      let productFiles = [];
      let model3dFile = null;

      try {
        tags = product.tags ? JSON.parse(product.tags) : [];
      } catch {}
      try {
        features = product.features ? JSON.parse(product.features) : [];
      } catch {}
      try {
        mediaImages = product.mediaImages ? JSON.parse(product.mediaImages) : [];
      } catch {}
      try {
        productFiles = product.productFiles ? JSON.parse(product.productFiles) : [];
      } catch {}
      try {
        model3dFile = product.model3dFile ? JSON.parse(product.model3dFile) : null;
      } catch {}

      return {
        ...product,
        tags,
        features,
        mediaImages,
        productFiles,
        model3dFile,
        price: parseFloat(product.price.toString()),
      };
    });

    return NextResponse.json({
      ok: true,
      products: productsParsed,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('[/api/admin/products] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

