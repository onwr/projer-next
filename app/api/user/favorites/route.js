import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;

    // Kullanıcının favorilerini getir
    let userFavorites = [];
    try {
      userFavorites = await prisma.userFavorite.findMany({
        where: {
          userId,
        },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              category: true,
              subcategory: true,
              price: true,
              coverImage: true,
              views: true,
              likes: true,
              downloads: true,
              status: true,
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  storeName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (err) {
      // UserFavorite tablosu yoksa veya Prisma client güncel değilse
      if (err.message?.includes('userFavorite') || err.message?.includes('findMany')) {
        console.error('UserFavorite modeli bulunamadı. Prisma client generate edilmeli ve tablo oluşturulmalı.');
        return NextResponse.json({ ok: true, favorites: [] }, { status: 200 });
      }
      throw err;
    }

    // Debug: Favorileri logla
    console.log('[/api/user/favorites] User favorites count:', userFavorites.length);
    console.log('[/api/user/favorites] Sample favorite:', userFavorites[0] ? {
      id: userFavorites[0].id,
      userId: userFavorites[0].userId,
      productId: userFavorites[0].productId,
      product: userFavorites[0].product ? {
        id: userFavorites[0].product.id,
        title: userFavorites[0].product.title,
        status: userFavorites[0].product.status,
      } : 'null',
    } : 'empty');

    // Tüm favorileri döndür (product null olmayan ve silinmemiş olanlar)
    const favorites = userFavorites
      .filter((uf) => uf.product !== null && uf.product !== undefined)
      .map((uf) => ({
        id: uf.product.id,
        title: uf.product.title,
        slug: uf.product.slug,
        category: uf.product.category,
        subcategory: uf.product.subcategory,
        price: parseFloat(uf.product.price.toString()),
        originalPrice: null,
        rating: 0,
        likes: uf.product.likes || 0,
        views: uf.product.views || 0,
        downloads: uf.product.downloads || 0,
        image: uf.product.coverImage || '/logo.svg',
        isLiked: true,
        author: {
          name: uf.product.author?.storeName || `${uf.product.author?.firstName || ''} ${uf.product.author?.lastName || ''}`.trim(),
          profileImage: uf.product.author?.profileImage || null,
        },
      }));

    return NextResponse.json({
      ok: true,
      favorites,
    });
  } catch (e) {
    console.error('[/api/user/favorites] Error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

