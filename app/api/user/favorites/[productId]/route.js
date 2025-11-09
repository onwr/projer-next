import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function POST(request, ctx) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await ctx.params;

    // Ürünü bul (slug veya id ile)
    let product = await prisma.product.findUnique({
      where: { slug: productId },
    });

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: productId },
      });
    }

    if (!product) {
      return NextResponse.json({ ok: false, error: 'Ürün bulunamadı' }, { status: 404 });
    }

    // Kullanıcının bu ürünü favorilerinde olup olmadığını kontrol et
    let existingFavorite = null;
    try {
      existingFavorite = await prisma.userFavorite.findUnique({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId: product.id,
          },
        },
      });
    } catch (err) {
      // UserFavorite tablosu yoksa veya Prisma client güncel değilse
      if (err.message?.includes('userFavorite') || err.message?.includes('findUnique')) {
        console.error('UserFavorite modeli bulunamadı. Prisma client generate edilmeli ve tablo oluşturulmalı.');
        return NextResponse.json({ 
          ok: false, 
          error: 'Favori sistemi henüz hazır değil. Lütfen Prisma client generate edin ve veritabanı tablosunu oluşturun.' 
        }, { status: 500 });
      }
      throw err;
    }

    if (existingFavorite) {
      // Zaten favorilerde, çıkar
      await prisma.userFavorite.delete({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId: product.id,
          },
        },
      });

      // Likes sayacını azalt
      await prisma.product.update({
        where: { id: product.id },
        data: {
          likes: {
            decrement: 1,
          },
        },
      });

      return NextResponse.json({
        ok: true,
        isFavorite: false,
        likes: Math.max(0, (product.likes || 0) - 1),
      });
    } else {
      // Favorilere ekle
      await prisma.userFavorite.create({
        data: {
          userId: session.user.id,
          productId: product.id,
        },
      });

      // Likes sayacını artır
      await prisma.product.update({
        where: { id: product.id },
        data: {
          likes: {
            increment: 1,
          },
        },
      });

      return NextResponse.json({
        ok: true,
        isFavorite: true,
        likes: (product.likes || 0) + 1,
      });
    }
  } catch (error) {
    console.error('[/api/user/favorites/[productId]] Error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Favori işlemi başarısız' }, { status: 500 });
  }
}

export async function GET(request, ctx) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ ok: false, isFavorite: false }, { status: 200 });
    }

    const { productId } = await ctx.params;

    // Ürünü bul (slug veya id ile)
    let product = await prisma.product.findUnique({
      where: { slug: productId },
    });

    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: productId },
      });
    }

    if (!product) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    // Kullanıcının bu ürünü favorilerinde olup olmadığını kontrol et
    let favorite = null;
    try {
      favorite = await prisma.userFavorite.findUnique({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId: product.id,
          },
        },
      });
    } catch (err) {
      // UserFavorite tablosu yoksa veya Prisma client güncel değilse
      if (err.message?.includes('userFavorite') || err.message?.includes('findUnique')) {
        console.error('UserFavorite modeli bulunamadı.');
        return NextResponse.json({ ok: false, isFavorite: false, error: 'Favori sistemi henüz hazır değil' }, { status: 200 });
      }
      throw err;
    }

    return NextResponse.json({
      ok: true,
      isFavorite: !!favorite,
      productId: product.id,
    });
  } catch (error) {
    console.error('[/api/user/favorites/[productId]] Error:', error);
    return NextResponse.json({ ok: false, isFavorite: false, error: error.message }, { status: 200 });
  }
}
