# PROJER.com - Next.js Migration

React + Vite + Firebase projesinden Next.js 16 + MySQL + Prisma'ya tam migrasyon.

## 🚀 Hızlı Başlangıç

```bash
# Bağımlılıkları kur
npm install

# .env dosyasını düzenle
cp .env.example .env

# MySQL veritabanı oluştur
mysql -u root -p
CREATE DATABASE projer_com;
EXIT;

# Prisma migration
npx prisma generate
npx prisma db push

# Geliştirme sunucusu
npm run dev
```

Detaylı kurulum için `MIGRATION-README.md` dosyasına bakın.

## 📦 Kurulu Paketler

Tüm gerekli paketler otomatik olarak kurulacak:

```bash
npm install
```

## 🔧 Yapılandırma

`.env` dosyasında şunları ayarlayın:

- `DATABASE_URL` - MySQL bağlantı string
- `NEXTAUTH_URL` - Site URL'i
- `NEXTAUTH_SECRET` - Random secret key
- `IMGBB_API_KEY` - ImgBB API key
- `BUNNY_CDN_*` - Bunny CDN bilgileri

## 📚 Dökümanlar

- `MIGRATION-README.md` - Detaylı migration rehberi
- `scripts/README.md` - Firestore migration scripti
- `prisma/schema.prisma` - Database schema

## ⚡ Özellikler

- ✅ Server-side rendering
- ✅ API Routes
- ✅ Authentication (NextAuth.js)
- ✅ MySQL + Prisma ORM
- ✅ Redux state management
- ✅ File uploads (ImgBB + Bunny CDN)
- ✅ 3D model preview
- ✅ Responsive design (Tailwind CSS)

## 🛠 Komutlar

```bash
npm run dev      # Geliştirme sunucusu
npm run build    # Production build
npm run start    # Production sunucusu
npm run lint     # Linting
```

## 📄 Lisans

MIT

---

Detaylı bilgi için: `MIGRATION-README.md`
