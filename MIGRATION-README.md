# 🚀 PROJER.com - React → Next.js Migration

## ✅ Tamamlanan İşlemler

### 1. Temel Yapı

- ✅ Next.js 16 projesi oluşturuldu (JavaScript)
- ✅ Prisma schema oluşturuldu (MySQL)
- ✅ NextAuth.js yapılandırıldı
- ✅ Middleware (route protection) eklendi
- ✅ Redux store entegrasyonu (Next.js 14 App Router uyumlu)

### 2. API Routes (Tümü JavaScript)

- ✅ `/api/auth/[...nextauth]` - NextAuth handler
- ✅ `/api/products` - Ürün listesi ve ekleme
- ✅ `/api/products/[id]` - Tek ürün işlemleri (GET, PUT, DELETE)
- ✅ `/api/upload` - Dosya yükleme (ImgBB + Bunny CDN)
- ✅ `/api/register` - Kullanıcı kayıt
- ✅ `/api/balance` - Bakiye sorgulama
- ✅ `/api/withdrawals` - Çekim talepleri
- ✅ `/api/bank-accounts` - Banka hesapları

### 3. Components

- ✅ `Header.jsx` - Next.js Link ve next-auth/react entegrasyonu
- ✅ `Footer.jsx` - Footer component
- ✅ `ReduxProvider.jsx` - Redux store provider
- ✅ `SessionProvider.jsx` - NextAuth session provider

### 4. Lib & Utils

- ✅ `lib/prisma.js` - Prisma client
- ✅ `lib/auth.js` - NextAuth yapılandırması
- ✅ `lib/utils.js` - Utility fonksiyonlar
- ✅ `lib/upload.js` - Upload fonksiyonlar (ImgBB, Bunny CDN)
- ✅ `lib/redux/store.js` - Redux store
- ✅ `lib/redux/cartSlice.js` - Sepet slice

### 5. Database

- ✅ Prisma schema (8 model: User, Product, Balance, Withdrawal, BankAccount, Order)
- ✅ Migration script (Firestore → MySQL)

## 🔧 Kurulum Adımları

### 1. Bağımlılıkları Kur

```bash
cd projer-next
npm install
```

### 2. .env Dosyasını Oluştur

`.env` dosyası oluştur ve şu içeriği ekle:

```env
DATABASE_URL="mysql://root:password@localhost:3306/projer_com"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super-secret-random-key-change-this"
IMGBB_API_KEY="d31794837252249df832c8f59cf80110"
BUNNY_CDN_URL="https://storage.bunnycdn.com/projer-files/"
BUNNY_API_KEY="dee7ada6-2667-4f00-b5fdeee67983-1970-4ddf"
BUNNY_PULL_ZONE="https://projer-files.b-cdn.net"
```

### 3. MySQL Veritabanı Oluştur

```bash
mysql -u root -p
CREATE DATABASE projer_com CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 4. Prisma Migration

```bash
npx prisma generate
npx prisma db push
```

### 5. Firestore'dan Veri Taşıma (Opsiyonel)

Firebase Service Account JSON dosyasını indir ve `scripts/firebase-service-account.json` olarak kaydet, sonra:

```bash
node scripts/migrate-firestore.js
```

### 6. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresine git.

## 📁 Proje Yapısı

```
projer-next/
├── app/
│   ├── api/                      # API Routes
│   │   ├── auth/[...nextauth]/
│   │   ├── products/
│   │   ├── upload/
│   │   ├── register/
│   │   ├── balance/
│   │   ├── withdrawals/
│   │   └── bank-accounts/
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Ana sayfa
│   └── unauthorized/page.js      # Yetkisiz erişim sayfası
│
├── components/
│   ├── providers/
│   │   ├── ReduxProvider.jsx
│   │   └── SessionProvider.jsx
│   ├── Header.jsx
│   └── Footer.jsx
│
├── lib/
│   ├── redux/
│   │   ├── store.js
│   │   └── cartSlice.js
│   ├── prisma.js
│   ├── auth.js
│   ├── utils.js
│   └── upload.js
│
├── prisma/
│   └── schema.prisma
│
├── scripts/
│   ├── migrate-firestore.js
│   └── README.md
│
├── middleware.js                 # Route protection
├── jsconfig.json                 # Path aliases (@/*)
└── .env                          # Environment variables
```

## 🚧 Kalan İşler

### Sayfa Componentleri (React src/ → Next.js app/)

#### Public Pages

- [ ] `app/page.js` - Home page (Hero, Categories, Products)
- [ ] `app/kategori/[slug]/page.js` - Category detail
- [ ] `app/urun/[slug]/page.js` - Product detail
- [ ] `app/arama/page.js` - Search results

#### Auth Pages

- [ ] `app/(auth)/giris/page.js` - Login
- [ ] `app/(auth)/kayit/page.js` - Register

#### Dashboard Pages

- [ ] `app/magaza-paneli/page.js` - Store panel
- [ ] `app/magaza-paneli/urun-ekle/page.js` - Add product
- [ ] `app/magaza-paneli/urun-duzenle/[id]/page.js` - Edit product
- [ ] `app/kullanici-paneli/page.js` - User panel
- [ ] `app/yonetici/page.js` - Admin panel
- [ ] `app/yonetici/urunler/page.js` - Admin products
- [ ] `app/yonetici/satin-alimlar/page.js` - Admin purchases
- [ ] `app/yonetici/odeme-bildirimleri/page.js` - Payment notifications
- [ ] `app/yonetici/destek-bildirimleri/page.js` - Support notifications
- [ ] `app/yonetici/giris-cikis-loglari/page.js` - Login logs

#### Client Components

- [ ] `components/Cart.jsx` - Shopping cart
- [ ] `components/ModelViewer.jsx` - 3D model viewer (React Three Fiber)
- [ ] `components/home/*` - Home page components
- [ ] `components/store/*` - Store panel components
- [ ] `components/admin/*` - Admin panel components

### İyileştirmeler

- [ ] SEO optimization (metadata)
- [ ] Image optimization (next/image)
- [ ] Loading states
- [ ] Error boundaries
- [ ] API rate limiting
- [ ] Input validation (Zod)

## 🔐 Authentication Flow

1. Kullanıcı `/kayit` sayfasında kayıt olur
2. Şifre bcrypt ile hashlen ip MySQL'e kaydedilir
3. `/giris` sayfasından NextAuth ile giriş yapılır
4. Session JWT ile yönetilir
5. Middleware korumalı route'ları kontrol eder

## 📊 Database Models

- **User**: Kullanıcılar (USER, STORE, ADMIN)
- **Product**: Ürünler (3D modeller)
- **Balance**: Kullanıcı bakiyeleri
- **Withdrawal**: Çekim talepleri
- **BankAccount**: Banka hesapları
- **Order**: Siparişler

## 🛠 Teknolojiler

- **Framework**: Next.js 16 (App Router)
- **Language**: JavaScript (TypeScript değil)
- **Database**: MySQL + Prisma ORM
- **Auth**: NextAuth.js
- **State**: Redux Toolkit
- **UI**: Tailwind CSS
- **Animation**: Framer Motion
- **3D**: React Three Fiber + Three.js
- **Storage**: Bunny CDN + ImgBB

## 📝 Notlar

- Tüm API routes JavaScript
- Client components `'use client'` directive ile işaretli
- Server components varsayılan
- Redux store App Router uyumlu
- Middleware JWT token kontrolü yapıyor
- Migration script Firestore'dan MySQL'e veri taşıyor

## 🐛 Sorun Giderme

### Prisma Client bulunamıyor

```bash
npx prisma generate
```

### MySQL bağlantı hatası

`.env` dosyasındaki `DATABASE_URL`'i kontrol et.

### NextAuth callback URL hatası

`.env` dosyasındaki `NEXTAUTH_URL`'i kontrol et.

### Redis package yüklü değil hatası

Bunny CDN için Redux kullanıyoruz, Redis gerekmez.

## 📞 Destek

Herhangi bir sorun için issue açın veya iletişime geçin.

---

**PROJER.com** - 3D Model Marketplace
