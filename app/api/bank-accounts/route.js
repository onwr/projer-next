import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';

export async function GET(request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      ok: true,
      bankAccounts: bankAccounts.map((ba) => ({
        id: ba.id,
        accountName: ba.accountName,
        bankName: ba.bankName,
        iban: ba.iban,
        createdAt: ba.createdAt,
      })),
    });
  } catch (error) {
    console.error('[/api/bank-accounts] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { accountName, bankName, iban } = data;

    if (!accountName || !bankName || !iban) {
      return NextResponse.json({ ok: false, error: 'Eksik bilgiler' }, { status: 400 });
    }

    // IBAN format kontrolü
    const cleanedIban = iban.replace(/\s/g, '').toUpperCase();
    if (!cleanedIban.startsWith('TR') || cleanedIban.length !== 26) {
      return NextResponse.json({ ok: false, error: 'Geçersiz IBAN formatı' }, { status: 400 });
    }

    // Mevcut banka hesabı sayısını kontrol et
    const existingCount = await prisma.bankAccount.count({
      where: { userId: session.user.id },
    });

    if (existingCount >= 1) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Sadece 1 adet banka hesabı ekleyebilirsiniz' 
      }, { status: 400 });
    }

    const bankAccount = await prisma.bankAccount.create({
      data: {
        userId: session.user.id,
        accountName,
        bankName,
        iban: cleanedIban,
      },
    });

    return NextResponse.json({
      ok: true,
      bankAccount: {
        id: bankAccount.id,
        accountName: bankAccount.accountName,
        bankName: bankAccount.bankName,
        iban: bankAccount.iban,
        createdAt: bankAccount.createdAt,
      },
    });
  } catch (error) {
    console.error('[/api/bank-accounts POST] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Banka hesabı ID gereklidir' }, { status: 400 });
    }

    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id },
    });

    if (!bankAccount || bankAccount.userId !== session.user.id) {
      return NextResponse.json({ ok: false, error: 'Yetkisiz erişim' }, { status: 403 });
    }

    await prisma.bankAccount.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[/api/bank-accounts DELETE] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
