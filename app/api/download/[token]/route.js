import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import crypto from 'crypto';

// Token'ı doğrula ve dosya bilgilerini döndür
export async function GET(request, ctx) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await ctx.params;

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Token gerekli' }, { status: 400 });
    }

    // Token'ı decode et (base64)
    let decodedData;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      decodedData = JSON.parse(decoded);
    } catch {
      return NextResponse.json({ ok: false, error: 'Geçersiz token' }, { status: 400 });
    }

    const { userId, productId, fileIndex, timestamp, hash } = decodedData;

    // Token süresi kontrolü (5 dakika)
    const now = Date.now();
    if (now - timestamp > 5 * 60 * 1000) {
      return NextResponse.json({ ok: false, error: 'Token süresi dolmuş' }, { status: 403 });
    }

    // Kullanıcı kontrolü
    if (userId !== session.user.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Hash doğrulama
    const secret = process.env.NEXTAUTH_SECRET || 'dev-secret-key-change-in-production';
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(`${userId}:${productId}:${fileIndex}:${timestamp}`)
      .digest('hex');

    if (hash !== expectedHash) {
      return NextResponse.json({ ok: false, error: 'Geçersiz token' }, { status: 400 });
    }

    // Ürünü bul
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ ok: false, error: 'Ürün bulunamadı' }, { status: 404 });
    }

    // Kullanıcının bu ürünü satın alıp almadığını kontrol et
    const order = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        productId: product.id,
        status: 'COMPLETED',
      },
    });

    const isFree = product.isFree || parseFloat(product.price.toString()) <= 0;
    const hasPurchased = !!order;

    if (!isFree && !hasPurchased) {
      return NextResponse.json({ ok: false, error: 'Bu ürünü satın almadınız' }, { status: 403 });
    }

    // Ürün dosyalarını parse et
    const safeParse = (str) => {
      if (!str) return [];
      try {
        return typeof str === 'string' ? JSON.parse(str) : str;
      } catch {
        return [];
      }
    };

    const productFiles = safeParse(product.productFiles || '[]');

    if (fileIndex < 0 || fileIndex >= productFiles.length) {
      return NextResponse.json({ ok: false, error: 'Dosya bulunamadı' }, { status: 404 });
    }

    const file = productFiles[fileIndex];

    if (!file || !file.url) {
      return NextResponse.json({ ok: false, error: 'Dosya URL bulunamadı' }, { status: 404 });
    }

    // Dosyayı yönlendir veya proxy et
    return NextResponse.redirect(file.url);
  } catch (error) {
    console.error('[/api/download/[token]] Error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'İndirme hatası' }, { status: 500 });
  }
}

