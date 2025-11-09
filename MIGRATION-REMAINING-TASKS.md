# Migrasyon Devam Eden Görevler

## ✅ Tamamlanan

- NextAuth.js yapılandırması (NextAuth 5 beta)
- Login sayfası oluşturuldu
- Home sayfası component entegrasyonu
- API Routes yapılandırması
- Middleware route protection

## 🔄 Devam Eden Görevler

### 1. Auth System

- [ ] Register sayfası (app/kayit/page.jsx)
- [ ] API route test et
- [ ] .env dosyası oluştur (NEXTAUTH_SECRET)

### 2. Sayfa Migrasyonu

#### Public Pages

- [ ] ProductDetail (app/urun/[slug]/page.jsx)
- [ ] CategoryDetail (app/kategori/[slug]/page.jsx)
- [ ] Products listing (app/urunler/page.jsx)

#### Dashboard Pages

- [ ] StorePanel (app/magaza-paneli/page.jsx)
  - [ ] ProductsTab
  - [ ] BalanceTab
  - [ ] OrdersTab
  - [ ] SupportTab
  - [ ] DashboardTab
- [ ] UserPanel (app/kullanici-paneli/page.jsx)
- [ ] AdminPanel (app/yonetici/page.jsx)
- [ ] AddProduct (app/urun-ekle/page.jsx)
- [ ] EditProduct (app/urun-duzenle/[id]/page.jsx)

### 3. Component Migrasyonu

#### Core Components

- [ ] Products (components/home/Products.jsx)
- [ ] Cart (components/Cart.jsx) - Redux entegrasyonu
- [ ] ModelViewer (components/ModelViewer.jsx) - React Three Fiber

#### Store Components

- [ ] components/store/ProductsTab.jsx
- [ ] components/store/BalanceTab.jsx
- [ ] components/store/OrdersTab.jsx
- [ ] components/store/SupportTab.jsx
- [ ] components/store/DashboardTab.jsx
- [ ] components/store/AddProductModal.jsx
- [ ] components/store/CreateTicketModal.jsx
- [ ] components/store/TicketDetailModal.jsx

#### Admin Components

- [ ] components/admin/Sidebar.jsx
- [ ] components/admin/OverviewCards.jsx
- [ ] components/admin/AnalyticsChart.jsx
- [ ] components/admin/CDNAnalysis.jsx
- [ ] components/admin/charts/DonutChart.jsx(k)
- [ ] components/admin/charts/LineChart.jsx

### 4. Utils & Hooks

- [ ] lib/upload.js - ImgBB ve Bunny CDN upload
- [ ] lib/modelAnalyzer.js - Model file analysis
- [ ] hooks/useProducts.js - API data fetching
- [ ] hooks/useAuth.js - NextAuth wrapper

### 5. API Routes Test

- [ ] GET /api/products
- [ ] GET /api/products/[id]
- [ ] POST /api/products
- [ ] POST /api/register
- [ ] POST /api/upload
- [ ] GET /api/balance
- [ ] GET /api/withdrawals
- [ ] GET /api/bank-accounts

## 📋 Manuel Çalıştırılacak Komutlar

1. MySQL veritabanını oluştur:

```bash
mysql -u root -p
CREATE DATABASE projer_com CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

2. .env dosyası oluştur:

```
DATABASE_URL="mysql://root:password@localhost:3306/projer_com"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super-secret-key-change-this"
IMGBB_API_KEY="d31794837252249df832c8f59cf80110"
BUNNY_CDN_URL="https://storage.bunnycdn.com/projer-files/"
BUNNY_API_KEY="dee7ada6-2667-4f00-b5fdeee67983-1970-4ddf"
BUNNY_PULL_ZONE="https://projer-files.b-cdn.net"
```

3. Prisma migrate:

```bash
npx prisma generate
npx prisma db push
```

4. Development server:

```bash
npm run dev
```

## 🔍 Notlar

- Tüm componentler client component olmalı ('use client' directive)
- Next.js Link component kullan (react-router-dom Link değil)
- API çağrıları fetch API ile yapılmalı
- Redux store Next.js ile uyumlu provider'da
- NextAuth.js session Next.js 5 beta formatıyla
