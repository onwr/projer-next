import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth.js';

const pickUpdatable = (data = {}) => {
  const {
    title,
    slug,
    description,
    category,
    subcategory,
    price,
    isFree,
    license,
    tags,
    features,
    geometry,
    graphic,
    polygons,
    vertices,
    gameReady,
    aiGenerated,
    coverImage,
    mediaImages,
    productFiles,
    status,
  } = data;
  return {
    ...(title !== undefined && { title }),
    ...(slug !== undefined && { slug }),
    ...(description !== undefined && { description }),
    ...(category !== undefined && { category }),
    ...(subcategory !== undefined && { subcategory }),
    ...(price !== undefined && { price: Number(price) || 0 }),
    ...(isFree !== undefined && { isFree: !!isFree }),
    ...(license !== undefined && { license }),
    ...(Array.isArray(tags) && { tags }),
    ...(Array.isArray(features) && { features }),
    ...(geometry !== undefined && { geometry }),
    ...(graphic !== undefined && { graphic }),
    ...(polygons !== undefined && { polygons: Number(polygons) || 0 }),
    ...(vertices !== undefined && { vertices: Number(vertices) || 0 }),
    ...(gameReady !== undefined && { gameReady: !!gameReady }),
    ...(aiGenerated !== undefined && { aiGenerated: !!aiGenerated }),
    ...(coverImage !== undefined && { coverImage }),
    ...(Array.isArray(mediaImages) && { mediaImages }),
    ...(Array.isArray(productFiles) && { productFiles }),
    ...(status !== undefined && { status }),
  };
};

const safeParse = (v, fallback) => {
  if (v == null) return fallback;
  try {
    return typeof v === 'string' ? JSON.parse(v) : v;
  } catch (_) {
    return fallback;
  }
};

export async function GET(request, ctx) {
  try {
    const { id } = await ctx.params;
    
    // Önce slug ile ara, bulunamazsa id ile ara
    let product = await prisma.product.findUnique({
      where: { slug: id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            storeName: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });
    
    // Slug ile bulunamadıysa id ile dene
    if (!product) {
      product = await prisma.product.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              storeName: true,
              profileImage: true,
            },
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
      });
    }
    
    if (!product) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }
    
    // Eğer ürün pasif (DRAFT, PENDING, REJECTED) ise, sadece sahibi ve admin görebilmeli
    if (product.status !== 'APPROVED') {
      const session = await auth().catch(() => null);
      
      if (!session) {
        return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
      }
      
      const isOwner = product.authorId === session.user?.id;
      const isAdmin = session.user?.userType === 'ADMIN';
      
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
      }
    }
    
    // JSON alanlarını parse et
    const parsedProduct = {
      ...product,
      tags: safeParse(product.tags, []),
      features: safeParse(product.features, []),
      mediaImages: safeParse(product.mediaImages, []),
      productFiles: safeParse(product.productFiles, []),
      model3dFile: product.model3dFile ? safeParse(product.model3dFile, null) : null,
      price: Number(product.price),
    };
    
    return NextResponse.json({ ok: true, item: parsedProduct }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err?.message || 'Error' }, { status: 200 });
  }
}

export async function PATCH(request, ctx) {
  try {
    const { id } = await ctx.params;
    const body = await request.json().catch(() => ({}));
    const data = pickUpdatable(body);
    // Eski şema ile uyumluluk: JSON alanlar metin sütunlarda saklanıyorsa stringe çevir
    const ensureString = (v) => (typeof v === 'string' ? v : JSON.stringify(v ?? null));
    if (data.tags !== undefined) data.tags = ensureString(data.tags);
    if (data.features !== undefined) data.features = ensureString(data.features);
    if (data.mediaImages !== undefined) data.mediaImages = ensureString(data.mediaImages);
    if (data.productFiles !== undefined) data.productFiles = ensureString(data.productFiles);
    if (data.model3dFile !== undefined) data.model3dFile = ensureString(data.model3dFile);
    const updated = await prisma.product.update({ where: { id }, data });
    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    // Prisma unique constraint
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { ok: false, error: 'Benzersiz alan çakışması (örn. slug). Farklı bir değer deneyin.' },
        { status: 200 }
      );
    }
    return NextResponse.json({ ok: false, error: err?.message || 'Update error' }, { status: 200 });
  }
}

export async function DELETE(request, ctx) {
  try {
    const { id } = await ctx.params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Delete error' }, { status: 200 });
  }
}
