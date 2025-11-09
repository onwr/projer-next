# Admin Kullanıcı Oluşturma ve Yönetimi

## MySQL Tablo Yapısı

User tablosu şu şekilde görünüyor:

```sql
CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(191) NOT NULL,
  `firstName` VARCHAR(191) NOT NULL,
  `lastName` VARCHAR(191) NOT NULL,
  `userType` ENUM('USER', 'STORE', 'ADMIN') NOT NULL DEFAULT 'USER',
  `emailVerified` BOOLEAN NOT NULL DEFAULT false,
  `storeName` VARCHAR(191) NULL,
  `storeDescription` TEXT NULL,
  `phone` VARCHAR(191) NULL,
  `profileImage` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `User_email_idx` (`email`),
  INDEX `User_userType_idx` (`userType`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## SQL Komutları

### 1. Mevcut Bir Kullanıcıyı Admin Yapma

```sql
-- Email ile admin yapma
UPDATE `User` 
SET `userType` = 'ADMIN' 
WHERE `email` = 'admin@example.com';

-- ID ile admin yapma
UPDATE `User` 
SET `userType` = 'ADMIN' 
WHERE `id` = 'user_id_buraya';

-- Tüm admin kullanıcıları görüntüleme
SELECT `id`, `email`, `firstName`, `lastName`, `userType`, `createdAt` 
FROM `User` 
WHERE `userType` = 'ADMIN';
```

### 2. Yeni Admin Kullanıcı Oluşturma

Önce şifreyi hash'lemek gerekir. Node.js ile:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('şifreniz', 10).then(h => console.log(h));"
```

Ardından SQL:

```sql
INSERT INTO `User` (
  `id`, 
  `email`, 
  `password`, 
  `firstName`, 
  `lastName`, 
  `userType`, 
  `emailVerified`,
  `createdAt`,
  `updatedAt`
) VALUES (
  UUID() -- veya manuel bir ID
  'admin@projer.com',
  '$2a$10$hash_edilmiş_şifre_buraya', -- bcrypt hash
  'Admin',
  'Kullanıcı',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

### 3. Prisma Studio ile Admin Yapma

```bash
cd projer-next
npx prisma studio
```

Prisma Studio açıldığında:
1. User tablosuna git
2. Admin yapmak istediğiniz kullanıcıyı bul
3. `userType` alanını `ADMIN` olarak değiştir
4. Kaydet

### 4. API ile Admin Yapma (Gelecekte)

Admin paneli üzerinden de yapılabilir (şu anda kullanıcı yönetimi sayfası var).

## Kontrol Komutları

### Admin Kullanıcıları Listeleme

```sql
SELECT 
  id,
  email,
  firstName,
  lastName,
  userType,
  emailVerified,
  createdAt
FROM `User`
WHERE `userType` = 'ADMIN'
ORDER BY `createdAt` DESC;
```

### Belirli Bir Email'in Admin Olup Olmadığını Kontrol Etme

```sql
SELECT `userType` 
FROM `User` 
WHERE `email` = 'admin@example.com';
```

## Önemli Notlar

1. **userType Enum Değerleri:**
   - `USER` - Normal kullanıcı
   - `STORE` - Mağaza sahibi
   - `ADMIN` - Admin kullanıcı

2. **Güvenlik:**
   - Admin kullanıcılar middleware'de kontrol ediliyor
   - `/yonetici/*` route'ları sadece ADMIN'lere açık
   - Tüm admin API'lerinde `userType === 'ADMIN'` kontrolü var

3. **İlk Admin Oluşturma:**
   - İlk admin kullanıcıyı SQL ile manuel oluşturmanız gerekebilir
   - Veya mevcut bir kullanıcıyı admin yapabilirsiniz

## Hızlı Başlangıç

### Seçenek 1: Mevcut Kullanıcıyı Admin Yap

```sql
-- Email ile
UPDATE `User` SET `userType` = 'ADMIN' WHERE `email` = 'sizin@email.com';
```

### Seçenek 2: Prisma Studio Kullan

```bash
cd projer-next
npx prisma studio
```

Ardından User tablosunda `userType` değerini `ADMIN` yap.

### Seçenek 3: Admin Panel Üzerinden (Gelecekte)

Kullanıcı Yönetimi sayfasından `userType` değiştirilebilir (zaten kod var).

