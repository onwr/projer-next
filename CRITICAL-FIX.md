# KRITIK: NextAuth Hatası Düzeltme

## Sorun

NextAuth session endpoint'i HTML döndürüyor (<!DOCTYPE hatası). Bu API route'un çalışmadığını gösterir.

## Yapılan Düzeltmeler

1. ✅ **lib/auth.js** - `async authorize` fonksiyonunda error handling iyileştirildi
   - `throw new Error` → `return null` (NextAuth best practice)
   - Try-catch bloğu eklendi

2. ✅ **API route import** - `@/lib/auth.js` alias kullanıldı

## ŞU ANDA YAPMALISINIZ

### 1. `.env` Dosyası Oluşturun (projer-next/.env):

```env
DATABASE_URL="mysql://root:password@localhost:3306/projer_com"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-this"
IMGBB_API_KEY="d31794837252249df832c8f59cf80110"
BUNNY_CDN_URL="https://storage.bunnycdn.com/projer-files/"
BUNNY_API_KEY="dee7ada6-2667-4f00-b5fdeee67983-1970-4ddf"
BUNNY_PULL_ZONE="https://projer-files.b-cdn.net"
```

### 2. MySQL Veritabanını Oluşturun:

```bash
mysql -u root -p
CREATE DATABASE projer_com CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3. Prisma Migration:

```bash
cd projer-next
npx prisma generate
npx prisma db push
```

### 4. Sunucuyu Başlatın:

```bash
npm run dev
```

## Neden Hata Alıyorsunuz?

1. **.env dosyası yok** → `process.env.NEXTAUTH_SECRET` undefined oluyor
2. **Database yok** → Prisma bağlantı hatası veriyor
3. **Migration yapılmadı** → User tablosu oluşmamış

## Test

1. `.env` dosyasını oluşturun
2. MySQL'i kurun ve migrate edin
3. Sunucuyu başlatın
4. `http://localhost:3000/giris` adresine gidin
5. SessionProvider hatası kaybolmalı
