import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import { createActivityLog } from '@/lib/logger.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category') || '';
    const subcategory = searchParams.get('subcategory') || '';
    const isFree = searchParams.get('isFree');
    const license = searchParams.get('license') || '';
    const sort = (searchParams.get('sort') || 'newest').toLowerCase();
    const authorId = searchParams.get('authorId') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '12')));

    const where = {
      status: 'APPROVED', // Sadece aktif ürünler gösterilsin
      ...(category && { category }),
      ...(subcategory && { subcategory }),
      ...(authorId && { authorId }),
      ...(license && { license }),
      ...(typeof isFree === 'string' && (isFree === 'true' || isFree === 'false')
        ? { isFree: isFree === 'true' }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
              { category: { contains: q } },
              { subcategory: { contains: q } },
            ],
          }
        : {}),
    };

    let orderBy = { createdAt: 'desc' };
    if (sort === 'views') orderBy = { views: 'desc' };
    else if (sort === 'downloads') orderBy = { downloads: 'desc' };
    else if (sort === 'price_asc') orderBy = { price: 'asc' };
    else if (sort === 'price_desc') orderBy = { price: 'desc' };
    else orderBy = { createdAt: 'desc' };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, storeName: true },
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const items = products.map((product) => ({
      ...product,
      tags: safeParse(product.tags, []),
      features: safeParse(product.features, []),
      mediaImages: safeParse(product.mediaImages, []),
      productFiles: safeParse(product.productFiles, []),
      model3dFile: product.model3dFile ? safeParse(product.model3dFile, null) : null,
      price: Number(product.price),
    }));

    return NextResponse.json({ ok: true, items, total, page, pageSize });
  } catch (error) {
    console.error('[/api/products] Error:', error);
    const errorMessage = error.message || 'Bilinmeyen bir hata oluştu';
    
    // Veritabanı bağlantı hatasını kontrol et
    if (errorMessage.includes('Can\'t reach database server') || errorMessage.includes('localhost:3306')) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Veritabanı bağlantı hatası. Lütfen .env dosyasında DATABASE_URL\'i kontrol edin ve MySQL sunucusunun çalıştığından emin olun.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 200 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session || session.user.userType !== 'STORE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const product = await prisma.product.create({
      data: {
        ...data,
        tags: JSON.stringify(data.tags || []),
        features: JSON.stringify(data.features || []),
        mediaImages: JSON.stringify(data.mediaImages || []),
        productFiles: JSON.stringify(data.productFiles || []),
        model3dFile: data.model3dFile ? JSON.stringify(data.model3dFile) : null,
        authorId: session.user.id,
        status: 'APPROVED', // Otomatik yayına al
      },
    });

    // Log kaydı
    createActivityLog({
      action: 'PRODUCT_CREATE',
      entityType: 'Product',
      entityId: product.id,
      userId: session.user.id,
      description: `Ürün oluşturuldu: ${product.title}`,
      request,
      metadata: { productId: product.id, title: product.title, price: product.price, category: product.category },
    }).catch(() => {}); // Non-blocking

    return NextResponse.json({ ok: true, item: product });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
  }
}

function safeParse(v, fallback) {
  if (v == null) return fallback;
  try {
    return typeof v === 'string' ? JSON.parse(v) : v;
  } catch (_) {
    return fallback;
  }
}
