import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import { createActivityLog } from '@/lib/logger.js';

// Dolar kurunu çek (helper function)
const getExchangeRate = async () => {
  try {
    // TCMB API'den USD/TRY kurunu çek
    const response = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml', {
      next: { revalidate: 300 },
    });
    
    if (response.ok) {
      const xmlText = await response.text();
      const usdMatch = xmlText.match(/<Currency[^>]*Kod="USD"[^>]*>([\s\S]*?)<\/Currency>/);
      if (usdMatch) {
        const forexBuyingMatch = usdMatch[1].match(/<ForexBuying>([^<]+)<\/ForexBuying>/);
        if (forexBuyingMatch) {
          const rate = parseFloat(forexBuyingMatch[1].trim());
          if (!isNaN(rate) && rate > 0) {
            return rate;
          }
        }
      }
    }
    
    // Fallback: exchangerate-api
    try {
      const fallbackResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
        next: { revalidate: 300 },
      });
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        const tryRate = data.rates?.TRY;
        if (tryRate && tryRate > 0) {
          return tryRate;
        }
      }
    } catch {}
    
    // Son fallback
    return 35.0;
  } catch {
    return 35.0;
  }
};

export async function GET(request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        bankAccount: {
          select: {
            accountName: true,
            bankName: true,
            iban: true,
          },
        },
      },
    });

    // Dolar kurunu çek
    const exchangeRate = await getExchangeRate();

    const formattedWithdrawals = withdrawals.map((w) => {
      const amountTL = parseFloat(w.amount.toString());
      const amountUSD = amountTL / exchangeRate;
      return {
        id: w.id,
        amount: amountTL,
        amountUSD: parseFloat(amountUSD.toFixed(2)),
        bankAccountId: w.bankAccountId,
        status: w.status,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        bankAccount: w.bankAccount ? {
          accountName: w.bankAccount.accountName,
          bankName: w.bankAccount.bankName,
          iban: w.bankAccount.iban,
        } : null,
      };
    });

    return NextResponse.json({
      ok: true,
      withdrawals: formattedWithdrawals,
      exchangeRate: parseFloat(exchangeRate.toFixed(4)),
    });
  } catch (error) {
    console.error('[/api/withdrawals] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session) {
      console.log('Unauthorized');
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { amountUSD, bankAccountId } = data; // Artık amountUSD olarak geliyor

    if (!amountUSD || !bankAccountId) {
      return NextResponse.json({ ok: false, error: 'Eksik bilgiler' }, { status: 400 });
    }

    // Dolar kurunu çek
    const exchangeRate = await getExchangeRate();

    // Minimum 25 USD kontrolü
    if (amountUSD < 25) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Minimum çekim tutarı $25 USD\'dir' 
      }, { status: 400 });
    }

    // USD'yi TL'ye çevir
    const amountTL = amountUSD * exchangeRate;

    // Banka hesabı kontrolü
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });

    if (!bankAccount || bankAccount.userId !== session.user.id) {
      return NextResponse.json({ ok: false, error: 'Geçersiz banka hesabı' }, { status: 400 });
    }

    const balance = await prisma.balance.findUnique({
      where: { userId: session.user.id },
    });

    if (!balance) {
      return NextResponse.json({ ok: false, error: 'Bakiye bulunamadı' }, { status: 404 });
    }

    // Bakiye kontrolü (TL cinsinden)
    if (parseFloat(balance.activeBalance.toString()) < amountTL) {
      const activeBalanceUSD = parseFloat(balance.activeBalance.toString()) / exchangeRate;
      return NextResponse.json({ 
        ok: false, 
        error: `Yetersiz bakiye. Mevcut bakiyeniz: $${activeBalanceUSD.toFixed(2)} USD` 
      }, { status: 400 });
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: session.user.id,
        amount: amountTL, // Veritabanında TL olarak sakla
        bankAccountId,
        status: 'PENDING',
      },
    });

    await prisma.balance.update({
      where: { userId: session.user.id },
      data: {
        activeBalance: { decrement: amountTL },
        pendingBalance: { increment: amountTL },
      },
    });

    // Log kaydı
    createActivityLog({
      action: 'WITHDRAWAL_CREATE',
      entityType: 'Withdrawal',
      entityId: withdrawal.id,
      userId: session.user.id,
      description: `Çekim talebi oluşturuldu: $${amountUSD.toFixed(2)} USD (₺${amountTL.toFixed(2)} TRY)`,
      request,
      metadata: { withdrawalId: withdrawal.id, amountUSD, amountTL, bankAccountId },
    }).catch(() => {}); // Non-blocking

    return NextResponse.json({ 
      ok: true, 
      withdrawal: {
        ...withdrawal,
        amount: parseFloat(withdrawal.amount.toString()),
        amountUSD: parseFloat(amountUSD.toFixed(2)),
      }
    });
  } catch (error) {
    console.error('[/api/withdrawals POST] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
