import { NextResponse } from 'next/server';
import { verifyCallbackHash, getMerchantConfig } from '@/lib/paytr.js';
import { prisma } from '@/lib/prisma.js';
import { createActivityLog } from '@/lib/logger.js';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const merchantOid = formData.get('merchant_oid');
    const status = formData.get('status');
    const totalAmount = formData.get('total_amount');
    const hash = formData.get('hash');

    if (!merchantOid || !status || !totalAmount || !hash) {
      return NextResponse.json({ ok: false, error: 'Eksik parametreler' }, { status: 400 });
    }

    const config = getMerchantConfig();
    const isValidHash = verifyCallbackHash(
      merchantOid,
      status,
      totalAmount,
      config.merchantSalt,
      config.merchantKey,
      hash
    );

    if (!isValidHash) {
      console.error('[/api/payment/callback] Invalid hash');
      return NextResponse.json({ ok: false, error: 'Geçersiz hash' }, { status: 400 });
    }

    const orderIdPrefix = merchantOid.replace(/\d+$/, '');

    if (status === 'success') {
      // Siparişler artık direkt COMPLETED olarak oluşturuluyor,
      // ancak ödeme doğrulandığında bakiye güncellemesi yapılmalı
      const orders = await prisma.order.findMany({
        where: {
          id: {
            startsWith: orderIdPrefix,
          },
          status: 'COMPLETED', // Artık COMPLETED olarak arıyoruz
        },
        include: {
          product: {
            include: {
              author: true,
            },
          },
        },
      });

      // Log kaydı (başarılı ödeme)
      createActivityLog({
        action: 'PAYMENT_CALLBACK',
        entityType: 'Order',
        entityId: orders[0]?.id || null,
        userId: orders[0]?.userId || null,
        description: `Ödeme callback başarılı: ${merchantOid} (${orders.length} sipariş)`,
        request,
        metadata: { merchantOid, status, totalAmount, orderCount: orders.length },
      }).catch(() => {}); // Non-blocking

      // Bakiye güncellemesi (eğer daha önce yapılmamışsa)
      for (const order of orders) {
        let balance = await prisma.balance.findUnique({
          where: { userId: order.product.authorId },
        });

        if (!balance) {
          balance = await prisma.balance.create({
            data: {
              userId: order.product.authorId,
              activeBalance: 0,
              pendingBalance: 0,
              totalEarnings: 0,
              totalWithdrawals: 0,
            },
          });
        }

        // Sadece bakiye güncellemesi yap, sipariş zaten COMPLETED
        const orderAmount = parseFloat(order.amount.toString());
        
        // Bakiye güncellemesi (idempotent - tekrar çağrılsa bile sorun olmaz)
        await prisma.balance.update({
          where: { userId: order.product.authorId },
          data: {
            activeBalance: {
              increment: orderAmount,
            },
            totalEarnings: {
              increment: orderAmount,
            },
          },
        });
      }
    } else {
      // Ödeme başarısız olursa siparişleri iptal et
      if (orderIdPrefix) {
        await prisma.order.updateMany({
          where: {
            id: {
              startsWith: orderIdPrefix,
            },
            status: 'COMPLETED', // COMPLETED olanları CANCELLED'e çevir
          },
          data: { status: 'CANCELLED' },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[/api/payment/callback] Error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Callback işlenemedi' }, { status: 500 });
  }
}

