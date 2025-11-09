const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');

// Firebase Admin SDK service account - bu dosyayı Firebase Console'dan indir
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = admin.firestore();
const prisma = new PrismaClient();

async function migrateUsers() {
  console.log('\n📦 Kullanıcılar migrate ediliyor...');
  const usersSnapshot = await firestore.collection('users').get();
  let successCount = 0;
  let errorCount = 0;

  for (const doc of usersSnapshot.docs) {
    try {
      const data = doc.data();

      await prisma.user.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          email: data.email,
          password: await bcrypt.hash('TemporaryPass123!', 10),
          firstName: data.firstName,
          lastName: data.lastName,
          userType: data.userType.toUpperCase(),
          storeName: data.storeName || null,
          storeDescription: data.storeDescription || null,
          phone: data.phone || null,
          profileImage: data.profileImage || null,
          emailVerified: true,
          createdAt: data.createdAt?.toDate() || new Date(),
        },
      });
      successCount++;
    } catch (error) {
      console.error(`❌ Kullanıcı hatası (${doc.id}):`, error.message);
      errorCount++;
    }
  }

  console.log(`✅ ${successCount} kullanıcı migrate edildi (${errorCount} hata)`);
}

async function migrateProducts() {
  console.log('\n📦 Ürünler migrate ediliyor...');
  const productsSnapshot = await firestore.collection('products').get();
  let successCount = 0;
  let errorCount = 0;

  for (const doc of productsSnapshot.docs) {
    try {
      const data = doc.data();

      await prisma.product.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          title: data.title,
          slug: data.slug,
          description: data.description,
          category: data.category,
          subcategory: data.subcategory || null,
          price: parseFloat(data.price) || 0,
          isFree: data.isFree || false,
          license: data.license,
          tags: JSON.stringify(data.tags || []),
          features: JSON.stringify(data.features || []),
          geometry: data.geometry,
          polygons: data.polygons || 0,
          vertices: data.vertices || 0,
          gameReady: data.gameReady || false,
          aiGenerated: data.aiGenerated || false,
          coverImage: data.coverImage,
          mediaImages: JSON.stringify(data.mediaImages || []),
          productFiles: JSON.stringify(data.productFiles || []),
          model3dFile: data.model3dFile ? JSON.stringify(data.model3dFile) : null,
          status: data.status.toUpperCase(),
          views: data.views || 0,
          likes: data.likes || 0,
          downloads: data.downloads || 0,
          authorId: data.authorId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        },
      });
      successCount++;
    } catch (error) {
      console.error(`❌ Ürün hatası (${doc.id}):`, error.message);
      errorCount++;
    }
  }

  console.log(`✅ ${successCount} ürün migrate edildi (${errorCount} hata)`);
}

async function migrateBalances() {
  console.log('\n📦 Bakiye kayıtları migrate ediliyor...');
  const balancesSnapshot = await firestore.collection('balances').get();
  let successCount = 0;
  let errorCount = 0;

  for (const doc of balancesSnapshot.docs) {
    try {
      const data = doc.data();

      await prisma.balance.upsert({
        where: { userId: data.userId },
        update: {},
        create: {
          userId: data.userId,
          activeBalance: parseFloat(data.activeBalance) || 0,
          pendingBalance: parseFloat(data.pendingBalance) || 0,
          totalEarnings: parseFloat(data.totalEarnings) || 0,
          totalWithdrawals: parseFloat(data.totalWithdrawals) || 0,
        },
      });
      successCount++;
    } catch (error) {
      console.error(`❌ Bakiye hatası (${doc.id}):`, error.message);
      errorCount++;
    }
  }

  console.log(`✅ ${successCount} bakiye kaydı migrate edildi (${errorCount} hata)`);
}

async function migrateBankAccounts() {
  console.log('\n📦 Banka hesapları migrate ediliyor...');
  const bankAccountsSnapshot = await firestore.collection('bankAccounts').get();
  let successCount = 0;
  let errorCount = 0;

  for (const doc of bankAccountsSnapshot.docs) {
    try {
      const data = doc.data();

      await prisma.bankAccount.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          userId: data.userId,
          accountName: data.accountName,
          bankName: data.bankName,
          iban: data.iban,
          createdAt: data.createdAt?.toDate() || new Date(),
        },
      });
      successCount++;
    } catch (error) {
      console.error(`❌ Banka hesabı hatası (${doc.id}):`, error.message);
      errorCount++;
    }
  }

  console.log(`✅ ${successCount} banka hesabı migrate edildi (${errorCount} hata)`);
}

async function migrateWithdrawals() {
  console.log('\n📦 Çekim talepleri migrate ediliyor...');
  const withdrawalsSnapshot = await firestore.collection('withdrawals').get();
  let successCount = 0;
  let errorCount = 0;

  for (const doc of withdrawalsSnapshot.docs) {
    try {
      const data = doc.data();

      await prisma.withdrawal.upsert({
        where: { id: doc.id },
        update: {},
        create: {
          id: doc.id,
          userId: data.userId,
          amount: parseFloat(data.amount),
          status: data.status.toUpperCase(),
          bankAccountId: data.bankAccountId,
          createdAt: data.createdAt?.toDate() || new Date(),
        },
      });
      successCount++;
    } catch (error) {
      console.error(`❌ Çekim talebi hatası (${doc.id}):`, error.message);
      errorCount++;
    }
  }

  console.log(`✅ ${successCount} çekim talebi migrate edildi (${errorCount} hata)`);
}

async function main() {
  console.log('🚀 Firestore -> MySQL Migration Başlıyor...');
  console.log('='.repeat(50));

  try {
    await migrateUsers();
    await migrateProducts();
    await migrateBalances();
    await migrateBankAccounts();
    await migrateWithdrawals();

    console.log('\n' + '='.repeat(50));
    console.log('✅ Migration tamamlandı!');
    console.log('\n⚠️  ÖNEMLİ: Tüm kullanıcıların geçici şifresi: TemporaryPass123!');
    console.log(
      'Kullanıcılara şifre sıfırlama linki göndermeli veya manuel şifre değiştirme yapmalısınız.'
    );
  } catch (error) {
    console.error('\n❌ Migration sırasında kritik hata:', error);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('Beklenmeyen hata:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
