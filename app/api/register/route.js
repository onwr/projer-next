import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createActivityLog } from '@/lib/logger.js';

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      userType,
      storeName,
      storeDescription,
      phone,
      profileImage,
    } = data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Bu email adresi zaten kullanılıyor' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        userType: userType.toUpperCase(),
        emailVerified: true,
        ...(userType === 'store' && {
          storeName,
          storeDescription,
          phone,
          profileImage,
        }),
      },
    });

    // Log kaydı
    createActivityLog({
      action: 'REGISTER',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      description: `${user.firstName} ${user.lastName} kayıt oldu (${user.userType})`,
      request,
      metadata: { userType: user.userType, email: user.email },
    }).catch(() => {}); // Non-blocking

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
