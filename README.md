# Civarimda Backend API (NestJS)

Sosyal medya uygulaması için NestJS backend API.

## 🚀 Kurulum

### Docker ile MongoDB ve Redis

#### 1. Docker Environment Setup (İsteğe Bağlı)

```bash
# Docker environment dosyasını kopyala
cp docker.env.example .env.docker

# .env.docker dosyasını düzenle (özellikle production için)
# MongoDB ve Redis şifrelerini set et
```

#### 2. Servisleri Başlat

```bash
# Development modunda tüm servisleri başlat (Mongo Express dahil)
docker-compose --profile dev up -d

# Sadece MongoDB ve Redis'i başlat (production için)
docker-compose up -d

# Environment dosyası ile başlat
docker-compose --env-file .env.docker up -d

# Servis durumunu kontrol et
docker-compose ps

# Logları görüntüle
docker-compose logs -f

# Servisleri durdur
docker-compose down

# Servisleri ve verileri tamamen silmek için
docker-compose down -v
```

#### 3. Servis Bilgileri

**MongoDB:**
- Host: `localhost`
- Port: `27017` (varsayılan, `.env.docker`'da değiştirilebilir)
- Database: `civarimda`
- Auth: Development'ta yok, production'da `.env.docker`'dan

**MongoDB Web Arayüzü (Sadece Development):**
- URL: http://localhost:8082
- Kullanıcı adı: `.env.docker`'daki `MONGO_EXPRESS_USERNAME` (varsayılan: `admin`)
- Şifre: `.env.docker`'daki `MONGO_EXPRESS_PASSWORD` (varsayılan: `changeMe123!`)
- **NOT:** Production'da kullanmayın! Sadece `docker-compose --profile dev up -d` ile başlar

**Redis:**
- Host: `localhost`
- Port: `6379` (varsayılan, `.env.docker`'da değiştirilebilir)
- URL: `redis://localhost:6379`
- Password: Development'ta yok, production'da `.env.docker`'dan set edilebilir

**🔒 Güvenlik Notları:**
- Production'da **MUTLAKA** MongoDB username/password set edin (`.env.docker`)
- Production'da Mongo Express'i **KULLANMAYIN** (profil belirtmeyin)
- Production'da port'ları dışarıya açmayın veya firewall kullanın
- `.env.docker` dosyasını **asla** Git'e commit etmeyin

### Proje Kurulumu

```bash
npm install
```

### Environment Variables (.env dosyası oluşturun)

Proje root dizininde `.env` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
# ============================================
# REQUIRED VARIABLES (ZORUNLU)
# ============================================

# JWT Secret Key (min 32 chars for dev, min 64 chars for production)
# Güçlü bir secret oluşturun: openssl rand -base64 64
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-for-development

# MongoDB Connection URI
MONGODB_URI=mongodb://localhost:27017/civarimda

# ============================================
# OPTIONAL VARIABLES (OPSİYONEL)
# ============================================

# MongoDB Connection Pool Settings (Opsiyonel)
# Production için önerilen: MAX=50, MIN=10
# Development için önerilen: MAX=10, MIN=2
# MONGODB_MAX_POOL_SIZE=10
# MONGODB_MIN_POOL_SIZE=2

# ============================================
# ALERTING & MONITORING (OPSİYONEL)
# ============================================

# Webhook URL for alerts (Discord/Slack)
# Kritik hatalar ve güvenlik olayları bu webhook'a gönderilir
# ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
# ALERT_WEBHOOK_TYPE=discord (discord veya slack)

# Discord Webhook Oluşturma:
# 1. Discord sunucu ayarları → Entegrasyonlar → Webhook'lar
# 2. Yeni Webhook oluştur
# 3. Webhook URL'sini kopyala ve ALERT_WEBHOOK_URL'ye yapıştır

# Slack Webhook Oluşturma:
# 1. https://api.slack.com/apps → Create New App
# 2. Incoming Webhooks → Activate
# 3. Add New Webhook to Workspace
# 4. Webhook URL'sini kopyala ve ALERT_WEBHOOK_URL'ye yapıştır

# Redis Connection URL (varsayılan: redis://localhost:6379)
# Docker kullanıyorsanız: redis://redis:6379 (docker-compose network içinde)
REDIS_URL=redis://localhost:6379

# JWT Refresh Secret (belirtilmezse JWT_SECRET kullanılır)
# JWT_REFRESH_SECRET=your-refresh-secret-key

# CORS Origins (virgülle ayrılmış liste)
CORS_ORIGIN=http://localhost:3000,http://localhost:19006,http://10.0.2.2:3000

# Rate Limiting Configuration (TTL saniye başına istek limiti)
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Server Port (varsayılan: 3000)
PORT=3000

# Node Environment (development | production)
NODE_ENV=development
```

**Not:** `.env` dosyası `.gitignore` içinde olduğu için Git'e commit edilmeyecektir.

### Uygulamayı Başlatma

```bash
npm run start:dev
```

## 📡 API Endpoints

### Auth
- `POST /auth/register` - Kayıt
- `POST /auth/login` - Giriş
- `GET /auth/me` - Mevcut kullanıcı

### Users
- `GET /users/:userId` - Kullanıcı bilgisi
- `GET /users/search?q=query` - Kullanıcı arama
- `POST /users/:userId/follow` - Takip et
- `DELETE /users/:userId/follow` - Takipten çık
- `POST /users/:userId/block` - Engelle
- `DELETE /users/:userId/block` - Engeli kaldır
- `PUT /users/profile` - Profil güncelle
- `GET /users/blocked/list` - Engellenen kullanıcılar

### Posts
- `POST /posts` - Gönderi oluştur
- `GET /posts/feed` - Ana akış
- `GET /posts/user/:userId` - Kullanıcı gönderileri
- `POST /posts/:postId/like` - Beğen/Beğenme kaldır
- `GET /posts/:postId/comments` - Yorumlar
- `POST /posts/:postId/comments` - Yorum ekle

### Messages
- `GET /messages/conversations` - Konuşmalar
- `GET /messages/:conversationId` - Mesajlar
- `POST /messages` - Mesaj gönder
- `PUT /messages/:conversationId/read` - Okundu işaretle

### Notifications
- `GET /notifications` - Bildirimler
- `PUT /notifications/:id/read` - Okundu işaretle
- `PUT /notifications/read-all` - Tümünü okundu işaretle

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health (database, Redis status)
- `GET /health/metrics` - Performance metrics

Detaylı bilgi: [HEALTH_CHECK.md](./HEALTH_CHECK.md)

## 🔌 WebSocket

Socket.io ile gerçek zamanlı mesajlaşma:
- `sendMessage` event'i ile mesaj gönderilir
- `newMessage` event'i ile yeni mesaj alınır

## 🔐 Authentication

JWT token ile korumalı endpoint'ler:
```
Authorization: Bearer <token>
```

## 🛠️ Teknolojiler

- NestJS
- MongoDB + Mongoose
- Redis (Cache & Session Storage)
- Socket.io
- JWT Authentication
- TypeScript
- class-validator
- Winston (Logging)

## 📊 Redis Kullanımı

Bu proje Redis'i aşağıdaki amaçlarla kullanmaktadır:

### 🔥 Yüksek Öncelik
- **Feed Cache** - Post feed'i 5 dakika cache'lenir
- **Refresh Token Storage** - Refresh token'lar Redis'te 7 gün saklanır
- **Rate Limiting** - API isteklerini sınırlandırma (in-memory şu an)

### ⚡ Orta Öncelik
- **User Profile Cache** - Kullanıcı profilleri 30 dakika cache'lenir
- **Notification Count Cache** - Okunmamış bildirim sayısı 1 dakika cache'lenir
- **Message Unread Count Cache** - Okunmamış mesaj sayısı 1 dakika cache'lenir
- **User Search Cache** - Arama sonuçları 5 dakika cache'lenir

Detaylı bilgi için: [REDIS_KULLANIM_KILAVUZU.md](./REDIS_KULLANIM_KILAVUZU.md)
