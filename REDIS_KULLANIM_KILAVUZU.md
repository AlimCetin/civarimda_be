# Redis Kullanım Kılavuzu

Bu dokümanda, sosyal medya uygulamanızda Redis'in nerede ve nasıl kullanılması gerektiği detaylı olarak açıklanmıştır.

## 🎯 Öncelik Sırasına Göre Redis Kullanım Alanları

### 1. 🔥 YÜKSEK ÖNCELİK - Feed Cache (Post Feed)

**Neden Gerekli:**
- `PostsService.getFeed()` metodu her çağrıldığında kompleks MongoDB sorguları çalıştırıyor
- Block/follow kontrolü, pagination, private post filtreleme gibi işlemler maliyetli
- Kullanıcılar sık sık feed'i yeniliyor

**Kullanım:**
```typescript
// Cache key: feed:userId:page:limit
// TTL: 2-5 dakika
// Invalidate: Yeni post oluşturulduğunda, follow/unfollow işlemlerinde

// Örnek:
const cacheKey = `feed:${userId}:${page}:${limit}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// MongoDB query çalıştır
const result = await this.getFeedFromDB(...);

// Cache'e kaydet
await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 dakika
```

**Invalidation Stratejisi:**
- Kullanıcı yeni post paylaştığında: `feed:${userId}:*` key'lerini sil
- Follow/unfollow olduğunda: İlgili tüm feed cache'lerini temizle
- Post silindi/güncellendi: İlgili feed cache'lerini temizle

---

### 2. 🔥 YÜKSEK ÖNCELİK - Refresh Token Storage

**Neden Gerekli:**
- Şu anda refresh token'lar MongoDB'de tutuluyor (`UserCredentials`)
- Her token doğrulamasında DB sorgusu yapılıyor
- Redis TTL özelliği ile otomatik expire yapılabilir

**Kullanım:**
```typescript
// Cache key: refresh_token:userId
// TTL: 7 gün (refresh token süresi kadar)

// Token kaydetme
await redis.setex(`refresh_token:${userId}`, 604800, refreshToken); // 7 gün

// Token doğrulama
const storedToken = await redis.get(`refresh_token:${userId}`);
if (storedToken !== refreshToken) {
  throw new UnauthorizedException('Invalid refresh token');
}
```

**Avantajlar:**
- MongoDB'den daha hızlı
- TTL ile otomatik temizleme
- Logout'ta tek key silme işlemi yeterli

---

### 3. 🔥 YÜKSEK ÖNCELİK - Rate Limiting

**Neden Gerekli:**
- `@nestjs/throttler` mevcut ama distributed sistem için Redis adapter gerekli
- API abuse'i önlemek için kritik

**Kullanım:**
```typescript
// NestJS ThrottlerModule ile Redis adapter kullanımı
ThrottlerModule.forRoot({
  ttl: 60,
  limit: 100,
  storage: new ThrottlerStorageRedisService(redis), // Redis adapter
})
```

**Rate Limit Senaryoları:**
- Login: 5 deneme/dakika
- Post oluşturma: 10/dakika
- Like/Comment: 60/dakika
- Search: 30/dakika

---

### 4. ⚡ ORTA ÖNCELİK - User Profile Cache

**Neden Gerekli:**
- User profil bilgileri sık sık okunuyor ama nadiren değişiyor
- `UsersService.findById()` her seferinde DB'ye gidiyor

**Kullanım:**
```typescript
// Cache key: user:userId
// TTL: 30 dakika
// Invalidate: Profil güncellendiğinde

const cacheKey = `user:${userId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const user = await this.userModel.findById(userId);
await redis.setex(cacheKey, 1800, JSON.stringify(user)); // 30 dakika
```

**Invalidation:**
- Profil güncellendiğinde (`updateProfile`)
- Hesap silindiğinde

---

### 5. ⚡ ORTA ÖNCELİK - Notification Count Cache

**Neden Gerekli:**
- Her sayfa yüklendiğinde `getUnreadCount()` çağrılıyor
- MongoDB count sorgusu her seferinde çalışıyor

**Kullanım:**
```typescript
// Cache key: notification:unread:userId
// TTL: 1 dakika (real-time'a yakın)

// Cache'den oku
const cached = await redis.get(`notification:unread:${userId}`);
if (cached !== null) return parseInt(cached);

// MongoDB'den hesapla
const count = await this.notificationModel.countDocuments({...});
await redis.setex(`notification:unread:${userId}`, 60, count.toString());

// Yeni bildirim geldiğinde increment
await redis.incr(`notification:unread:${userId}`);
await redis.expire(`notification:unread:${userId}`, 60);
```

**Invalidation/Update:**
- Yeni bildirim oluşturulduğunda: `INCR`
- Bildirim okunduğunda: `DECR` veya cache'i sil
- Tüm bildirimler okunduğunda: Cache'i 0'a set et

---

### 6. ⚡ ORTA ÖNCELİK - Message Unread Count Cache

**Neden Gerekli:**
- `getUnreadMessagesCount()` kompleks aggregation sorgusu çalıştırıyor
- Her mesaj ekranı açıldığında çalışıyor

**Kullanım:**
```typescript
// Cache key: messages:unread:userId
// TTL: 1 dakika

// Cache stratejisi notification count ile aynı
// Yeni mesaj geldiğinde: INCR
// Mesaj okunduğunda: DECR veya cache sil
```

---

### 7. ⚡ ORTA ÖNCELİK - User Search Results Cache

**Neden Gerekli:**
- Arama sonuçları kısa süre için geçerli olabilir
- Aynı arama kısa sürede tekrar yapılabilir

**Kullanım:**
```typescript
// Cache key: search:users:query (normalize edilmiş)
// TTL: 5 dakika

const normalizedQuery = query.trim().toLowerCase();
const cacheKey = `search:users:${normalizedQuery}`;

const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const results = await this.userModel.find({...});
await redis.setex(cacheKey, 300, JSON.stringify(results));
```

**Not:** Çok kısa süreli cache (5 dakika) çünkü yeni kullanıcılar hemen görünmeli

---

### 8. 🔵 DÜŞÜK ÖNCELİK - Post Like/Comment Count Cache

**Neden Gerekli:**
- Post detaylarında like/comment count gösteriliyor
- Her post görüntülendiğinde `likes.length` hesaplanıyor

**Kullanım:**
```typescript
// Cache key: post:stats:postId
// TTL: 10 dakika
// Invalidate: Like/unlike, comment eklendiğinde

interface PostStats {
  likeCount: number;
  commentCount: number;
}

// Like/unlike olduğunda:
await redis.incr(`post:stats:${postId}:likes`);
// veya
await redis.decr(`post:stats:${postId}:likes`);
```

**Dikkat:** MongoDB ile senkronizasyon önemli. Cache miss olduğunda DB'den yükle.

---

### 9. 🔵 DÜŞÜK ÖNCELİK - Online Status (Real-time)

**Neden Gerekli:**
- WebSocket bağlantılarında kullanıcının online durumunu göstermek
- Kullanıcı bağlandığında/ayrıldığında status güncellemek

**Kullanım:**
```typescript
// Cache key: user:online:userId
// TTL: 60 saniye (heartbeat)

// WebSocket bağlantısı kurulduğunda
await redis.setex(`user:online:${userId}`, 60, 'true');

// Heartbeat - her 30 saniyede bir yenile
setInterval(async () => {
  await redis.setex(`user:online:${userId}`, 60, 'true');
}, 30000);

// Bağlantı kapandığında
await redis.del(`user:online:${userId}`);
```

---

### 10. 🔵 DÜŞÜK ÖNCELİK - Session Store (WebSocket)

**Neden Gerekli:**
- WebSocket bağlantılarında kullanıcı ID'lerini tutmak
- Distributed sistemde farklı sunucular için gerekli

**Kullanım:**
```typescript
// WebSocket gateway'de
// Cache key: ws:session:userId
// TTL: 1 saat

await redis.setex(`ws:session:${userId}`, 3600, socketId);
```

---

## 📦 Redis Kurulum ve Konfigürasyon

### 1. Package Installation

```bash
cd 1_backend
npm install redis @nestjs/throttler-storage-redis
npm install -D @types/redis
```

### 2. Docker Compose (Önerilen)

`docker-compose.yml` dosyanıza ekleyin:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  redis-data:
```

### 3. NestJS Module Oluşturma

`src/common/redis/redis.module.ts`:

```typescript
import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {
  static forRoot() {
    return {
      module: RedisModule,
      providers: [
        {
          provide: RedisService,
          useFactory: async (configService: ConfigService) => {
            const service = new RedisService();
            await service.connect(configService.get('REDIS_URL') || 'redis://localhost:6379');
            return service;
          },
          inject: [ConfigService],
        },
      ],
      exports: [RedisService],
    };
  }
}
```

`src/common/redis/redis.service.ts`:

```typescript
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: RedisClientType;

  async connect(url: string) {
    this.client = createClient({ url });
    this.client.on('error', (err) => console.error('Redis Client Error', err));
    await this.client.connect();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
```

---

## 🔄 Cache Invalidation Stratejisi

### Pattern-based Invalidation

```typescript
// Tüm feed cache'lerini temizle
async invalidateFeedCache(userId: string) {
  const keys = await redis.keys(`feed:${userId}:*`);
  if (keys.length > 0) {
    await Promise.all(keys.map(key => redis.del(key)));
  }
}

// Tüm kullanıcı profil cache'lerini temizle (global invalidation)
async invalidateAllUserCaches() {
  const keys = await redis.keys('user:*');
  // Batch delete (100'lük gruplar halinde)
  for (let i = 0; i < keys.length; i += 100) {
    await Promise.all(keys.slice(i, i + 100).map(key => redis.del(key)));
  }
}
```

---

## 📊 Performans Metrikleri

### Beklenen İyileştirmeler:

1. **Feed Loading:** ~500ms → ~50ms (10x hızlanma)
2. **Token Verification:** ~50ms → ~5ms (10x hızlanma)
3. **Notification Count:** ~100ms → ~2ms (50x hızlanma)
4. **User Profile:** ~30ms → ~3ms (10x hızlanma)
5. **Search Results:** ~200ms → ~10ms (20x hızlanma)

### Redis Memory Kullanımı (Tahmini):

- Feed cache (1000 aktif kullanıcı): ~50-100 MB
- User profiles: ~10-20 MB
- Refresh tokens: ~5-10 MB
- Notification counts: ~1-2 MB
- **Toplam:** ~70-130 MB (aylık 100K kullanıcı için)

---

## ⚠️ Dikkat Edilmesi Gerekenler

1. **Cache Stampede:** Çoklu istek aynı anda cache miss olduğunda DB'ye yük binmesi
   - **Çözüm:** Lock mekanizması (Redis SET NX) kullan

2. **Stale Data:** Cache'deki veri güncel olmayabilir
   - **Çözüm:** Kısa TTL değerleri ve doğru invalidation stratejisi

3. **Memory Management:** Redis memory limit aşılmamalı
   - **Çözüm:** `maxmemory-policy allkeys-lru` kullan

4. **Distributed Cache:** Birden fazla sunucu varsa Redis Cluster kullan

---

## 🚀 İmplementasyon Sırası (Önerilen)

1. ✅ **Adım 1:** Redis kurulumu ve temel service
2. ✅ **Adım 2:** Refresh token storage (en kolay, hızlı sonuç)
3. ✅ **Adım 3:** Feed cache (en büyük performans kazancı)
4. ✅ **Adım 4:** Rate limiting Redis adapter
5. ✅ **Adım 5:** Notification count cache
6. ✅ **Adım 6:** User profile cache
7. ✅ **Adım 7:** Diğer cache'ler (search, stats, vs.)

---

## 📚 İlave Kaynaklar

- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [NestJS Redis Module](https://docs.nestjs.com/microservices/redis)
- [Cache Patterns](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/Strategies.html)






