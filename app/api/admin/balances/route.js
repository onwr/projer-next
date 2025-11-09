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
    const orderId = searchParams.get('orderId') || '';
    const activeBalanceMin = searchParams.get('activeBalanceMin') || '';
    const activeBalanceMax = searchParams.get('activeBalanceMax') || '';
    const totalEarningsMin = searchParams.get('totalEarningsMin') || '';
    const totalEarningsMax = searchParams.get('totalEarningsMax') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * pageSize;

    // Önce tüm balance kayıtlarını çek, sonra user bilgileri ile birlikte filtrele
    // Böylece STORE olmayan kullanıcıların balance'ları da gösterilebilir (isteğe bağlı)
    
    // Sort handling - JavaScript'te sıralama yapacağız
    const validSortFields = ['activeBalance', 'pendingBalance', 'totalEarnings', 'totalWithdrawals', 'createdAt', 'updatedAt', 'storeName'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'desc';
    const sortByStoreName = safeSortBy === 'storeName';

    // Where clause - sadece balance filtreleri (activeBalanceMin, totalEarningsMin, vs.)
    const finalWhere = {
      ...(activeBalanceMin || activeBalanceMax ? {
        activeBalance: {
          ...(activeBalanceMin ? { gte: parseFloat(activeBalanceMin) } : {}),
          ...(activeBalanceMax ? { lte: parseFloat(activeBalanceMax) } : {}),
        },
      } : {}),
      ...(totalEarningsMin || totalEarningsMax ? {
        totalEarnings: {
          ...(totalEarningsMin ? { gte: parseFloat(totalEarningsMin) } : {}),
          ...(totalEarningsMax ? { lte: parseFloat(totalEarningsMax) } : {}),
        },
      } : {}),
    };

    // Debug: log where clause
    console.log('[/api/admin/balances] Final where clause:', JSON.stringify(finalWhere, null, 2));

    // Tüm balance kayıtlarını çek (user bilgileri ile birlikte)
    const [allBalances, totalCount] = await Promise.all([
      prisma.balance.findMany({
        where: finalWhere,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              storeName: true,
              profileImage: true,
              phone: true,
              userType: true, // userType'ı da getir
            },
          },
        },
      }),
      prisma.balance.count({ where: finalWhere }),
    ]);

    console.log('[/api/admin/balances] All balances fetched:', allBalances.length, 'Total:', totalCount);

    // JavaScript'te filtreleme: Sadece STORE kullanıcılarını göster
    let filteredBalances = allBalances.filter(b => b.user?.userType === 'STORE');

    // OrderID filtrelemesi
    if (orderId && orderId.trim()) {
      try {
        const order = await prisma.order.findUnique({
          where: { id: orderId.trim() },
          include: {
            product: {
              select: {
                authorId: true,
              },
            },
          },
        });
        
        if (order && order.product?.authorId) {
          // Sadece bu authorId'ye sahip balance'ları göster
          filteredBalances = filteredBalances.filter(b => b.userId === order.product.authorId);
        } else {
          // Order bulunamadıysa hiçbir sonuç gösterme
          filteredBalances = [];
        }
      } catch (error) {
        console.error('[/api/admin/balances] OrderID filter error:', error);
        // Hata durumunda tüm sonuçları göster
      }
    }

    // Search filtrelemesi (JavaScript'te)
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filteredBalances = filteredBalances.filter(b => {
        const u = b.user;
        if (!u) return false;
        return (
          (u.firstName && u.firstName.toLowerCase().includes(searchLower)) ||
          (u.lastName && u.lastName.toLowerCase().includes(searchLower)) ||
          (u.email && u.email.toLowerCase().includes(searchLower)) ||
          (u.storeName && u.storeName.toLowerCase().includes(searchLower))
        );
      });
    }

    // Sıralama (JavaScript'te)
    if (sortByStoreName || sortBy === 'storeName') {
      // storeName'e göre sıralama
      filteredBalances.sort((a, b) => {
        const aName = a.user?.storeName || `${a.user?.firstName || ''} ${a.user?.lastName || ''}` || '';
        const bName = b.user?.storeName || `${b.user?.firstName || ''} ${b.user?.lastName || ''}` || '';
        if (safeSortOrder === 'asc') {
          return aName.localeCompare(bName, 'tr');
        } else {
          return bName.localeCompare(aName, 'tr');
        }
      });
    } else {
      // Balance alanlarına göre sıralama
      filteredBalances.sort((a, b) => {
        let aValue, bValue;
        switch (safeSortBy) {
          case 'activeBalance':
            aValue = parseFloat(a.activeBalance.toString());
            bValue = parseFloat(b.activeBalance.toString());
            break;
          case 'pendingBalance':
            aValue = parseFloat(a.pendingBalance.toString());
            bValue = parseFloat(b.pendingBalance.toString());
            break;
          case 'totalEarnings':
            aValue = parseFloat(a.totalEarnings.toString());
            bValue = parseFloat(b.totalEarnings.toString());
            break;
          case 'totalWithdrawals':
            aValue = parseFloat(a.totalWithdrawals.toString());
            bValue = parseFloat(b.totalWithdrawals.toString());
            break;
          case 'updatedAt':
            aValue = new Date(a.updatedAt).getTime();
            bValue = new Date(b.updatedAt).getTime();
            break;
          default: // createdAt
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
        }
        if (safeSortOrder === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }

    // Total count (filtrelenmiş)
    const total = filteredBalances.length;

    // Pagination (JavaScript'te)
    const balances = filteredBalances.slice(skip, skip + pageSize);

    console.log('[/api/admin/balances] Filtered balances (STORE only):', filteredBalances.length, 'After pagination:', balances.length);

    // Get order counts and sales for each balance
    let balancesWithStats = await Promise.all(
      balances.map(async (balance) => {
        const [orderCount, salesCount, lastOrder] = await Promise.all([
          prisma.order.count({
            where: {
              product: {
                authorId: balance.userId,
              },
            },
          }),
          prisma.order.count({
            where: {
              status: 'COMPLETED',
              product: {
                authorId: balance.userId,
              },
            },
          }),
          prisma.order.findFirst({
            where: {
              status: 'COMPLETED',
              product: {
                authorId: balance.userId,
              },
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
        ]);

        return {
          ...balance,
          orderCount,
          salesCount,
          lastActivityDate: lastOrder?.createdAt || balance.updatedAt,
        };
      })
    );

    // Dolar kurunu çek (exchange-rate API'den)
    let exchangeRate = 35.0;
    try {
      const rateRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/exchange-rate`);
      if (rateRes.ok) {
        const rateData = await rateRes.json();
        if (rateData.ok && rateData.rate) {
          exchangeRate = rateData.rate;
        }
      }
    } catch {}

    const balancesWithUSD = balancesWithStats.map((balance) => {
      const activeBalanceTL = parseFloat(balance.activeBalance.toString());
      const pendingBalanceTL = parseFloat(balance.pendingBalance.toString());
      const totalEarningsTL = parseFloat(balance.totalEarnings.toString());
      const totalWithdrawalsTL = parseFloat(balance.totalWithdrawals.toString());

      return {
        id: balance.id,
        userId: balance.userId,
        activeBalance: activeBalanceTL,
        activeBalanceUSD: parseFloat((activeBalanceTL / exchangeRate).toFixed(2)),
        pendingBalance: pendingBalanceTL,
        pendingBalanceUSD: parseFloat((pendingBalanceTL / exchangeRate).toFixed(2)),
        totalEarnings: totalEarningsTL,
        totalEarningsUSD: parseFloat((totalEarningsTL / exchangeRate).toFixed(2)),
        totalWithdrawals: totalWithdrawalsTL,
        totalWithdrawalsUSD: parseFloat((totalWithdrawalsTL / exchangeRate).toFixed(2)),
        orderCount: balance.orderCount,
        salesCount: balance.salesCount,
        lastActivityDate: balance.lastActivityDate,
        createdAt: balance.createdAt,
        updatedAt: balance.updatedAt,
        user: balance.user,
      };
    });

    return NextResponse.json({
      ok: true,
      balances: balancesWithUSD,
      total,
      page,
      pageSize,
      exchangeRate: parseFloat(exchangeRate.toFixed(4)),
    });
  } catch (error) {
    console.error('[/api/admin/balances] Error:', error);
    console.error('[/api/admin/balances] Error stack:', error.stack);
    return NextResponse.json({ 
      ok: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

