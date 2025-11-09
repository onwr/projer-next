# Favoriler Sistemi Kurulumu

## Adım 1: Prisma Client'ı Generate Edin

Terminal'de şu komutu çalıştırın:

```bash
cd projer-next
npx prisma generate
```

Bu komut, schema'da tanımladığımız yeni `UserFavorite` modelini Prisma client'a ekler.

## Adım 2: Veritabanı Tablosunu Oluşturun

### Seçenek A: SQL ile (Önerilen - Production için)

MySQL'e bağlanın ve `add_user_favorite_table.sql` dosyasındaki SQL komutunu çalıştırın:

```sql
CREATE TABLE IF NOT EXISTS `UserFavorite` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserFavorite_userId_productId_key` (`userId`, `productId`),
  INDEX `UserFavorite_userId_idx` (`userId`),
  INDEX `UserFavorite_productId_idx` (`productId`),
  CONSTRAINT `UserFavorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserFavorite_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Seçenek B: Prisma DB Push ile (Development için)

```bash
cd projer-next
npx prisma db push
```

## Adım 3: Sunucuyu Yeniden Başlatın

Next.js development server'ı durdurup tekrar başlatın:

1. `Ctrl+C` ile durdurun
2. `npm run dev` ile tekrar başlatın

## Sorun Giderme

Eğer hala "Cannot read properties of undefined (reading 'findUnique')" hatası alıyorsanız:

1. **Prisma Client Cache'ini Temizleyin:**
   ```bash
   rm -rf node_modules/.prisma
   npx prisma generate
   ```

2. **Next.js Cache'ini Temizleyin:**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Veritabanı Tablosunun Varlığını Kontrol Edin:**
   ```sql
   SHOW TABLES LIKE 'UserFavorite';
   ```

4. **Prisma Studio ile Kontrol Edin:**
   ```bash
   npx prisma studio
   ```

## Önemli Notlar

- `npx prisma generate` komutunu schema'yı her değiştirdiğinizde çalıştırmanız gerekir
- Production ortamında migration kullanmak daha güvenlidir
- Development ortamında `db push` kullanabilirsiniz

