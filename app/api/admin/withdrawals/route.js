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
    const amountMin = searchParams.get('amountMin') || '';
    const amountMax = searchParams.get('amountMax') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const bankName = searchParams.get('bankName') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * pageSize;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (amountMin || amountMax) {
      where.amount = {};
      if (amountMin) where.amount.gte = parseFloat(amountMin);
      if (amountMax) where.amount.lte = parseFloat(amountMax);
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }
    // MySQL'de contains çalışmayabilir, bu yüzden search için alternatif yaklaşım
    // Önce arama yapılacak kullanıcıları bul (eğer search varsa)
    let userIds = [];
    if (search && search.trim()) {
      try {
        // Tüm kullanıcıları çek ve JavaScript'te filtrele (MySQL contains sorunları için geçici çözüm)
        const allUsers = await prisma.user.findMany({
          select: { 
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            storeName: true,
          },
        });
        
        const searchLower = search.toLowerCase().trim();
        userIds = allUsers
          .filter(u => 
            (u.firstName && u.firstName.toLowerCase().includes(searchLower)) ||
            (u.lastName && u.lastName.toLowerCase().includes(searchLower)) ||
            (u.email && u.email.toLowerCase().includes(searchLower)) ||
            (u.storeName && u.storeName.toLowerCase().includes(searchLower))
          )
          .map(u => u.id);
      } catch (error) {
        console.error('[/api/admin/withdrawals] Search users error:', error);
        // Hata durumunda search'ü ignore et
      }
    }
    
    // Bank account için IBAN araması
    let bankAccountIds = [];
    if (search && search.trim()) {
      try {
        // Tüm bank account'ları çek ve JavaScript'te filtrele
        const allBankAccounts = await prisma.bankAccount.findMany({
          select: { id: true, iban: true },
        });
        
        const searchLower = search.toLowerCase().trim();
        bankAccountIds = allBankAccounts
          .filter(ba => ba.iban && ba.iban.toLowerCase().includes(searchLower))
          .map(ba => ba.id);
      } catch (error) {
        console.error('[/api/admin/withdrawals] Search bank accounts error:', error);
        // Hata durumunda search'ü ignore et
      }
    }

    // Search filtrelemesi - sadece sonuç bulunduysa filtre ekle
    if (search && search.trim()) {
      if (userIds.length > 0 || bankAccountIds.length > 0) {
        const orConditions = [];
        if (userIds.length > 0) {
          orConditions.push({ userId: { in: userIds } });
        }
        if (bankAccountIds.length > 0) {
          orConditions.push({ bankAccountId: { in: bankAccountIds } });
        }
        if (orConditions.length > 0) {
          where.OR = orConditions;
        }
      }
      // Eğer search var ama sonuç yoksa, where'de hiçbir şey değiştirme
      // Boş array ile filtreleme MySQL hatası verir
    }

    // Bank name filtrelemesi
    if (bankName && bankName.trim()) {
      try {
        // Tüm bank account'ları çek ve JavaScript'te filtrele
        const allBankAccounts = await prisma.bankAccount.findMany({
          select: { id: true, bankName: true },
        });
        
        const bankNameLower = bankName.toLowerCase().trim();
        const baIds = allBankAccounts
          .filter(ba => ba.bankName && ba.bankName.toLowerCase().includes(bankNameLower))
          .map(ba => ba.id);
        
        if (baIds.length > 0) {
          where.bankAccountId = { in: baIds };
        }
        // Eğer bankName ile eşleşen bank account yoksa, filtre ekleme
        // Boş array ile filtreleme MySQL hatası verir
      } catch (error) {
        console.error('[/api/admin/withdrawals] Bank name filter error:', error);
        // Hata durumunda bank name filter'ını ignore et
      }
    }

    // OrderBy güvenlik kontrolü
    const validSortFields = ['id', 'amount', 'status', 'createdAt', 'updatedAt'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'desc';

    // Debug log
    console.log('[/api/admin/withdrawals] Where clause:', JSON.stringify(where, null, 2));
    console.log('[/api/admin/withdrawals] Page:', page, 'PageSize:', pageSize, 'Skip:', skip);
    console.log('[/api/admin/withdrawals] SortBy:', safeSortBy, 'SortOrder:', safeSortOrder);

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [safeSortBy]: safeSortOrder },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              storeName: true,
              email: true,
              phone: true,
              profileImage: true,
            },
          },
          bankAccount: {
            select: {
              accountName: true,
              bankName: true,
              iban: true,
            },
          },
        },
      }),
      prisma.withdrawal.count({ where }),
    ]);

    console.log('[/api/admin/withdrawals] Found withdrawals:', withdrawals.length, 'Total:', total);

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

    // Çekim taleplerinde amount TL olarak saklanıyor, USD'ye çevirmek için TL/rate yapıyoruz
    // Ama kullanıcı USD olarak giriyor, o yüzden veritabanında TL olarak saklanmış
    // Şimdi TL'den USD'ye çevirmek için: USD = TL / rate
    const withdrawalsWithUSD = withdrawals.map((w) => {
      const amountTL = parseFloat(w.amount.toString());
      const amountUSD = amountTL / exchangeRate;
      return {
        id: w.id,
        amount: amountTL,
        amountUSD: parseFloat(amountUSD.toFixed(2)),
        status: w.status,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        user: w.user,
        bankAccount: w.bankAccount,
      };
    });

    return NextResponse.json({
      ok: true,
      withdrawals: withdrawalsWithUSD,
      total,
      page,
      pageSize,
      exchangeRate: parseFloat(exchangeRate.toFixed(4)),
    });
  } catch (error) {
    console.error('[/api/admin/withdrawals] Error:', error);
    console.error('[/api/admin/withdrawals] Error stack:', error.stack);
    return NextResponse.json({ 
      ok: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

