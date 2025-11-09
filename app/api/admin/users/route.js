import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import bcrypt from 'bcryptjs';

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
    const userType = searchParams.get('userType') || '';
    const emailVerified = searchParams.get('emailVerified');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * pageSize;

    const where = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { storeName: { contains: search } },
      ];
    }
    if (userType) {
      where.userType = userType;
    }
    if (emailVerified !== null && emailVerified !== undefined) {
      where.emailVerified = emailVerified === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          emailVerified: true,
          storeName: true,
          phone: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Bakiye bilgilerini ekle
    const usersWithBalance = await Promise.all(
      users.map(async (user) => {
        const balance = await prisma.balance.findUnique({
          where: { userId: user.id },
          select: {
            activeBalance: true,
            totalEarnings: true,
          },
        });

        return {
          ...user,
          balance: balance
            ? {
                activeBalance: parseFloat(balance.activeBalance.toString()),
                totalEarnings: parseFloat(balance.totalEarnings.toString()),
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      users: usersWithBalance,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('[/api/admin/users] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'User ID required' }, { status: 400 });
    }

    // Şifre güncelleme
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        emailVerified: true,
        storeName: true,
        phone: true,
        profileImage: true,
      },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (error) {
    console.error('[/api/admin/users PATCH] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session || session.user?.userType !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'User ID required' }, { status: 400 });
    }

    // Admin kendi hesabını silemez
    if (id === session.user.id) {
      return NextResponse.json({ ok: false, error: 'Kendi hesabınızı silemezsiniz' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[/api/admin/users DELETE] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

