# Environment Variables Setup Guide

Bu dokümanda proje için gerekli environment variable'lar ve konfigürasyonları açıklanmıştır.

## 📋 Hızlı Başlangıç

1. Proje root dizininde `.env` dosyası oluşturun
2. Aşağıdaki şablonu kopyalayın ve kendi değerlerinizle doldurun
3. Uygulamayı başlatın: `npm run start:dev`

## 🔐 Zorunlu Environment Variables

### `JWT_SECRET`
- **Açıklama:** JWT token'ları imzalamak için kullanılan secret key
- **Gereksinimler:**
  - Development: Minimum 32 karakter
  - Production: Minimum 64 karakter
- **Örnek:** `your-super-secret-jwt-key-minimum-32-characters-long-for-development`
- **Güçlü Secret Oluşturma:**
  ```bash
  # Linux/Mac
  openssl rand -base64 64
  
  # Windows (PowerShell)
  [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
  ```

### `MONGODB_URI`
- **Açıklama:** MongoDB veritabanı bağlantı URI'si
- **Format:** `mongodb://[username:password@]host[:port][/database]`
- **Örnekler:**
  - Local: `mongodb://localhost:27017/tosyam`
  - Docker: `mongodb://mongodb:27017/tosyam` (docker-compose network içinde)
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/tosyam`

## ⚙️ Opsiyonel Environment Variables

### `REDIS_URL`
- **Açıklama:** Redis sunucusu bağlantı URL'si
- **Varsayılan:** `redis://localhost:6379`
- **Örnekler:**
  - Local: `redis://localhost:6379`
  - Docker: `redis://redis:6379` (docker-compose network içinde)
  - Şifreli: `redis://:password@localhost:6379`
  - Remote: `redis://username:password@redis.example.com:6379`

### `JWT_REFRESH_SECRET`
- **Açıklama:** Refresh token'ları imzalamak için kullanılan secret key
- **Varsayılan:** `JWT_SECRET` kullanılır (belirtilmezse)
- **Not:** Farklı bir secret kullanmak güvenliği artırır

### `CORS_ORIGIN`
- **Açıklama:** CORS izin verilen origin'ler (virgülle ayrılmış)
- **Varsayılan:** `http://localhost:3000,http://localhost:19006,http://10.0.2.2:3000`
- **Örnekler:**
  - Tek origin: `http://localhost:3000`
  - Çoklu origin: `http://localhost:3000,https://example.com`
  - Tüm origin'ler (güvensiz, sadece development): `*`

### `THROTTLE_TTL`
- **Açıklama:** Rate limiting için time-to-live (saniye cinsinden)
- **Varsayılan:** `60` (1 dakika)
- **Açıklama:** Bu süre içinde `THROTTLE_LIMIT` kadar istek yapılabilir

### `THROTTLE_LIMIT`
- **Açıklama:** Rate limiting için maksimum istek sayısı
- **Varsayılan:** `100`
- **Açıklama:** `THROTTLE_TTL` saniyesi içinde bu kadar istek yapılabilir

### `PORT`
- **Açıklama:** Backend sunucu portu
- **Varsayılan:** `3000`
- **Örnek:** `3000`, `8080`, `5000`

### `NODE_ENV`
- **Açıklama:** Node.js ortamı
- **Değerler:** `development` | `production`
- **Varsayılan:** `development`
- **Not:** Production modunda daha sıkı güvenlik kontrolleri yapılır

## 📝 Örnek .env Dosyası

```env
# ============================================
# REQUIRED VARIABLES (ZORUNLU)
# ============================================

# JWT Secret Key
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-for-development

# MongoDB Connection URI
MONGODB_URI=mongodb://localhost:27017/tosyam

# ============================================
# OPTIONAL VARIABLES (OPSİYONEL)
# ============================================

# Redis Connection URL
REDIS_URL=redis://localhost:6379

# JWT Refresh Secret (optional)
# JWT_REFRESH_SECRET=your-refresh-secret-key

# CORS Origins
CORS_ORIGIN=http://localhost:3000,http://localhost:19006,http://10.0.2.2:3000

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Server Port
PORT=3000

# Node Environment
NODE_ENV=development
```

## 🔒 Güvenlik Notları

1. **`.env` dosyasını Git'e commit etmeyin**
   - Dosya `.gitignore` içinde olmalı
   - Hassas bilgiler içerir

2. **Production ortamında:**
   - `JWT_SECRET` minimum 64 karakter olmalı
   - Güçlü ve rastgele secret key'ler kullanın
   - Environment variable'ları sunucu üzerinde ayarlayın (`.env` dosyası yerine)
   - `NODE_ENV=production` olarak ayarlayın

3. **Secret key'ler:**
   - Her ortam (dev, staging, production) için farklı secret'lar kullanın
   - Secret'ları düzenli olarak rotate edin

## 🐳 Docker ile Kullanım

Docker Compose kullanıyorsanız, servisler otomatik olarak aynı network'te olduğu için:

```env
# MongoDB Docker container için
MONGODB_URI=mongodb://mongodb:27017/tosyam

# Redis Docker container için
REDIS_URL=redis://redis:6379
```

Host makinesinden erişmek için (örneğin localhost'tan):
```env
MONGODB_URI=mongodb://localhost:27017/tosyam
REDIS_URL=redis://localhost:6379
```

## ✅ Doğrulama

Environment variable'larınızın doğru yapılandırıldığını kontrol etmek için:

```bash
# Uygulamayı başlatın
npm run start:dev

# Hata mesajları environment variable'ların eksik veya hatalı olduğunu gösterir
# Başarılı başlatma tüm gerekli değişkenlerin doğru olduğunu gösterir
```

## 📚 İlgili Dokümantasyon

- [Redis Kullanım Kılavuzu](./REDIS_KULLANIM_KILAVUZU.md)
- [Redis Nedir?](./REDIS_NEDIR.md)
- [Güvenlik ve Performans Analizi](./GÜVENLİK_VE_PERFORMANS_ANALİZİ.md)

