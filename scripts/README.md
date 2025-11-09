# Migration Scripts

## Firestore'dan MySQL'e Veri Taşıma

### Gereksinimler:

1. Firebase Admin SDK service account JSON dosyası
2. MySQL veritabanı kurulu ve çalışır durumda
3. `.env` dosyasında `DATABASE_URL` ayarlanmış

### Adımlar:

#### 1. Firebase Service Account İndirme:

1. Firebase Console'a git: https://console.firebase.google.com
2. Projenizi seçin (projer-com)
3. Settings > Service Accounts
4. "Generate New Private Key" butonuna tıkla
5. İndirilen JSON dosyasını `scripts/firebase-service-account.json` olarak kaydet

#### 2. MySQL Veritabanı Hazırlığı:

```bash
# MySQL'de veritabanı oluştur
mysql -u root -p
CREATE DATABASE projer_com CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### 3. Prisma Migration:

```bash
cd projer-next
npx prisma generate
npx prisma db push
```

#### 4. Migration Script Çalıştırma:

```bash
node scripts/migrate-firestore.js
```

### Migration Sonrası:

- ✅ Tüm kullanıcılar migrate edildi
- ✅ Tüm ürünler migrate edildi
- ✅ Bakiye kayıtları migrate edildi
- ✅ Banka hesapları migrate edildi
- ✅ Çekim talepleri migrate edildi

⚠️ **ÖNEMLİ**: Tüm kullanıcıların geçici şifresi `TemporaryPass123!` olarak ayarlanmıştır.

Kullanıcılara şifre sıfırlama fonksiyonu eklemeli veya manuel olarak şifrelerini değiştirmelerini sağlamalısınız.

### Hata Durumunda:

Script her collection için hata sayısını gösterir. Hatalar console'da detaylı şekilde loglanır.

```bash
# Tekrar çalıştırmak güvenlidir (upsert kullanır)
node scripts/migrate-firestore.js
```

### Veri Doğrulama:

```bash
# MySQL'de kayıt sayılarını kontrol et
mysql -u root -p projer_com

SELECT 'users' as table_name, COUNT(*) as count FROM User
UNION ALL SELECT 'products', COUNT(*) FROM Product
UNION ALL SELECT 'balances', COUNT(*) FROM Balance
UNION ALL SELECT 'bank_accounts', COUNT(*) FROM BankAccount
UNION ALL SELECT 'withdrawals', COUNT(*) FROM Withdrawal;
```
