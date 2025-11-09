import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

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

    let balance = await prisma.balance.findUnique({
      where: { userId: session.user.id },
    });

    if (!balance) {
      balance = await prisma.balance.create({
        data: {
          userId: session.user.id,
          activeBalance: 0,
          pendingBalance: 0,
          totalEarnings: 0,
          totalWithdrawals: 0,
        },
      });
    }

    // Mevcut COMPLETED siparişlerden bakiyeyi senkronize et
    // (Eğer callback çalışmadıysa veya manuel güncelleme gerekiyorsa)
    const completedOrders = await prisma.order.findMany({
      where: {
        product: {
          authorId: session.user.id,
        },
        status: 'COMPLETED',
      },
      include: {
        product: {
          select: {
            authorId: true,
          },
        },
      },
    });

    // Toplam kazançları hesapla
    const totalEarningsFromOrders = completedOrders.reduce((sum, order) => {
      return sum + parseFloat(order.amount.toString());
    }, 0);

    // Eğer bakiyedeki totalEarnings ile siparişlerden hesaplanan farklıysa, senkronize et
    const currentTotalEarnings = parseFloat(balance.totalEarnings.toString());
    const pendingBalanceAmount = parseFloat(balance.pendingBalance.toString());
    const totalWithdrawalsAmount = parseFloat(balance.totalWithdrawals.toString());
    
    if (Math.abs(currentTotalEarnings - totalEarningsFromOrders) > 0.01) {
      // Bakiyeyi senkronize et
      const newTotalEarnings = totalEarningsFromOrders;
      const newActiveBalance = newTotalEarnings - pendingBalanceAmount - totalWithdrawalsAmount;
      
      balance = await prisma.balance.update({
        where: { userId: session.user.id },
        data: {
          activeBalance: newActiveBalance >= 0 ? newActiveBalance : 0,
          totalEarnings: newTotalEarnings,
        },
      });
    }

    // Dolar kurunu çek
    const exchangeRate = await getExchangeRate();

    // TL değerleri
    const activeBalanceTL = parseFloat(balance.activeBalance.toString());
    const pendingBalanceTL = parseFloat(balance.pendingBalance.toString());
    const totalEarningsTL = parseFloat(balance.totalEarnings.toString());
    const totalWithdrawalsTL = parseFloat(balance.totalWithdrawals.toString());

    // Dolar değerleri
    const activeBalanceUSD = activeBalanceTL / exchangeRate;
    const pendingBalanceUSD = pendingBalanceTL / exchangeRate;
    const totalEarningsUSD = totalEarningsTL / exchangeRate;
    const totalWithdrawalsUSD = totalWithdrawalsTL / exchangeRate;

    return NextResponse.json({
      ok: true,
      // TL değerleri
      activeBalance: activeBalanceTL,
      pendingBalance: pendingBalanceTL,
      totalEarnings: totalEarningsTL,
      totalWithdrawals: totalWithdrawalsTL,
      // USD değerleri
      activeBalanceUSD: parseFloat(activeBalanceUSD.toFixed(2)),
      pendingBalanceUSD: parseFloat(pendingBalanceUSD.toFixed(2)),
      totalEarningsUSD: parseFloat(totalEarningsUSD.toFixed(2)),
      totalWithdrawalsUSD: parseFloat(totalWithdrawalsUSD.toFixed(2)),
      // Kur bilgisi
      exchangeRate: parseFloat(exchangeRate.toFixed(4)),
    });
  } catch (error) {
    console.error('[/api/balance] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
