import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Prisma bağlantısını test et ve hataları yakala
export const testPrismaConnection = async () => {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    if (error.message?.includes('did not initialize') || error.message?.includes('Prisma Client')) {
      console.error(
        '\n⚠️  Prisma Client henüz generate edilmemiş!\n' +
          'Lütfen şu komutu çalıştırın:\n' +
          '  npx prisma generate\n'
      );
    } else {
      console.error('Prisma connection error:', error.message);
    }
    return false;
  }
};
