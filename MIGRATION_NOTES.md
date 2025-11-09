# UserFavorite Tablosu Migration Notları

## Sorun
Mevcut production veritabanında migration geçmişi yok. Migration dosyaları oluşturulamıyor.

## Çözüm

### Seçenek 1: SQL ile Manuel Ekleme (Önerilen)

1. MySQL'e bağlanın
2. `add_user_favorite_table.sql` dosyasındaki SQL komutunu çalıştırın:

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

3. Migration geçmişini işaretlemek için (opsiyonel):
   ```bash
   npx prisma migrate resolve --applied add_user_favorite
   ```

### Seçenek 2: Prisma DB Push (Development için)

Eğer development ortamındaysanız:
```bash
cd projer-next
npx prisma db push
```

**Not:** `db push` migration geçmişi oluşturmaz, sadece schema'yı sync eder.

### Seçenek 3: Baseline Migration (Production için)

1. Prisma migrations klasörünü oluşturun:
   ```bash
   mkdir prisma\migrations
   mkdir prisma\migrations\0_init
   ```

2. Mevcut schema'yı migration olarak kaydedin:
   ```bash
   npx prisma migrate resolve --applied 0_init
   ```

3. Sonra yeni migration oluşturun:
   ```bash
   npx prisma migrate dev --name add_user_favorite
   ```

## Önerilen Yaklaşım

Production veritabanı için **Seçenek 1 (SQL ile manuel ekleme)** önerilir çünkü:
- Veri kaybı riski yok
- Migration geçmişi sorunları yok
- Daha güvenli ve kontrollü

