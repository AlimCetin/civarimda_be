# Redis Nedir? Ne İçin Kullanılır?

## 🎯 Redis Nedir?

**Redis** (Remote Dictionary Server), açık kaynak kodlu, **in-memory** (bellekte çalışan) bir veri yapısı deposudur. Temel özellikleri:

- ⚡ **Çok Hızlı**: Verileri RAM'de (bellekte) tuttuğu için çok hızlıdır
- 🗄️ **Anahtar-Değer (Key-Value) Deposu**: Verileri key-value çiftleri halinde saklar
- 📦 **Veri Yapıları**: String, List, Set, Hash, Sorted Set gibi yapıları destekler
- ⏱️ **TTL (Time To Live)**: Verilere otomatik silinme süresi verebilirsiniz
- 🔄 **Persistent**: İsteğe bağlı olarak verileri diske de kaydedebilir

---

## 🏪 Basit Benzetme: Süpermarket vs. Depo

### Normal Veritabanı (MongoDB, PostgreSQL) = DEPO
- Verileri diske yazar
- Büyük miktarda veri saklar
- Erişim biraz yavaştır (disk okuma/yazma)
- Kalıcıdır

### Redis = SÜPERMARKET RAFLARI
- En çok kullanılan ürünler raflarda (RAM'de)
- Çok hızlı erişim
- Sınırlı kapasite (RAM kadar)
- Geçici ama hızlı

**Örnek Senaryo:**
```
Kullanıcı: "Feed'imi göster"
Normal DB: Depoya git, ürünleri bul, getir → 500ms ⏱️
Redis: Raflardan direkt al → 5ms ⚡ (100x daha hızlı!)
```

---

## 💡 Redis Ne İçin Kullanılır?

### 1. 🚀 **Caching (Önbellekleme)** - EN YAYGIN KULLANIM

**Problem:** Veritabanı sorguları yavaş ve maliyetli

**Çözüm:** Sık kullanılan verileri Redis'te sakla

**Örnek Senaryolar:**

#### a) Feed Cache
```typescript
// ❌ YAVAS: Her seferinde MongoDB'ye sorgu
async getFeed(userId) {
  const posts = await db.find({ userId: { $in: following } }); // 500ms
  return posts;
}

// ✅ HIZLI: Önce Redis'ten kontrol et
async getFeed(userId) {
  // Önce cache'e bak
  const cached = await redis.get(`feed:${userId}`);
  if (cached) {
    return JSON.parse(cached); // 5ms - ÇOK HIZLI! ⚡
  }
  
  // Cache yoksa DB'den al ve cache'e kaydet
  const posts = await db.find({ ... }); // 500ms
  await redis.setex(`feed:${userId}`, 300, JSON.stringify(posts)); // 5 dakika cache
  return posts;
}
```

#### b) Kullanıcı Profili Cache
```typescript
// Kullanıcı profilini sık sık gösteriyoruz ama nadiren değişiyor
const user = await redis.get(`user:${userId}`);
if (!user) {
  const userFromDB = await db.users.findById(userId);
  await redis.setex(`user:${userId}`, 1800, JSON.stringify(userFromDB)); // 30 dakika
}
```

---

### 2. 🔐 **Session Management (Oturum Yönetimi)**

**Problem:** Kullanıcı oturumlarını veritabanında tutmak yavaş ve gereksiz

**Çözüm:** Redis'te session bilgilerini sakla

**Örnek:**
```typescript
// Kullanıcı giriş yaptı
const sessionId = generateSessionId();
await redis.setex(`session:${sessionId}`, 3600, userId); // 1 saat

// Her istekte session kontrolü (çok hızlı!)
const userId = await redis.get(`session:${sessionId}`);

// Çıkış yapınca sil
await redis.del(`session:${sessionId}`);
```

**Sizin Projenizde:**
- Refresh token'ları MongoDB yerine Redis'te saklayabilirsiniz
- 7 gün TTL ile otomatik silinir
- Her token doğrulaması çok daha hızlı olur

---

### 3. 🚦 **Rate Limiting (İstek Sınırlama)**

**Problem:** Kullanıcılar API'yi kötüye kullanabilir (spam, brute force)

**Çözüm:** Redis ile istek sayısını takip et

**Örnek:**
```typescript
// Her kullanıcı için dakikada maksimum 10 post oluşturabilir
async checkRateLimit(userId: string) {
  const key = `rate_limit:post:${userId}`;
  const count = await redis.incr(key); // Sayacı artır
  
  if (count === 1) {
    await redis.expire(key, 60); // İlk istekte 60 saniye TTL koy
  }
  
  if (count > 10) {
    throw new Error('Çok fazla istek! 1 dakika bekle.');
  }
  
  return true; // İstek geçerli
}
```

**Gerçek Hayat Örneği:**
- Login denemesi: 5 deneme/dakika
- Post oluşturma: 10/dakika
- Like/comment: 60/dakika

---

### 4. 📊 **Counter (Sayaç) Yönetimi**

**Problem:** Bildirim sayısını her seferinde veritabanından saymak yavaş

**Çözüm:** Redis'te sayaç tut

**Örnek:**
```typescript
// Bildirim sayısı
async getUnreadNotificationCount(userId: string) {
  // Önce cache'ten oku (çok hızlı!)
  const count = await redis.get(`notifications:unread:${userId}`);
  if (count !== null) {
    return parseInt(count); // 2ms
  }
  
  // Cache yoksa DB'den say
  const countFromDB = await db.notifications.count({ userId, read: false }); // 100ms
  await redis.setex(`notifications:unread:${userId}`, 60, countFromDB.toString());
  return countFromDB;
}

// Yeni bildirim geldiğinde
async createNotification(userId: string) {
  await db.notifications.create({ ... });
  
  // Redis'teki sayacı artır (çok hızlı!)
  await redis.incr(`notifications:unread:${userId}`); // 1ms
  await redis.expire(`notifications:unread:${userId}`, 60);
}

// Bildirim okunduğunda
async markAsRead(notificationId: string, userId: string) {
  await db.notifications.update({ read: true });
  
  // Redis'teki sayacı azalt
  await redis.decr(`notifications:unread:${userId}`); // 1ms
}
```

---

### 5. 🟢 **Real-time Features (Gerçek Zamanlı Özellikler)**

**Problem:** Kullanıcının online durumunu takip etmek

**Çözüm:** Redis ile heartbeat mekanizması

**Örnek:**
```typescript
// Kullanıcı bağlandığında
async userConnected(userId: string) {
  await redis.setex(`user:online:${userId}`, 60, 'true'); // 60 saniye TTL
}

// Her 30 saniyede bir heartbeat gönder
setInterval(async () => {
  await redis.setex(`user:online:${userId}`, 60, 'true');
}, 30000);

// Kullanıcı online mi?
async isUserOnline(userId: string) {
  const status = await redis.get(`user:online:${userId}`);
  return status === 'true';
}
```

---

### 6. 📝 **Message Queue (Mesaj Kuyruğu)**

**Problem:** E-posta gönderme, bildirim gönderme gibi yavaş işlemler

**Çözüm:** Redis List kullanarak kuyruk oluştur

**Örnek:**
```typescript
// E-posta gönderme işlemini kuyruğa ekle
await redis.lpush('email_queue', JSON.stringify({
  to: 'user@example.com',
  subject: 'Hoş geldiniz!',
  body: '...'
}));

// Background worker (başka bir process)
while (true) {
  const emailData = await redis.brpop('email_queue', 5); // Kuyruktan al
  if (emailData) {
    await sendEmail(JSON.parse(emailData));
  }
}
```

---

### 7. 🔍 **Search Results Cache (Arama Sonuçları)**

**Problem:** Aynı arama sorgusu sık sık tekrarlanıyor

**Çözüm:** Arama sonuçlarını kısa süre cache'le

**Örnek:**
```typescript
async searchUsers(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `search:users:${normalizedQuery}`;
  
  // Önce cache'e bak
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached); // 10ms
  }
  
  // Cache yoksa DB'den ara
  const results = await db.users.find({
    $or: [
      { username: { $regex: query, $options: 'i' } },
      { fullName: { $regex: query, $options: 'i' } }
    ]
  }); // 200ms
  
  // 5 dakika cache'le (yeni kullanıcılar hemen görünmeli)
  await redis.setex(cacheKey, 300, JSON.stringify(results));
  return results;
}
```

---

## ⚡ Redis vs. Normal Veritabanı

| Özellik | Redis | MongoDB/PostgreSQL |
|---------|-------|-------------------|
| **Hız** | ⚡⚡⚡ Çok hızlı (RAM'de) | 🐢 Yavaş (Disk'te) |
| **Kapasite** | 📦 Sınırlı (RAM kadar) | 💾 Çok büyük (Disk kadar) |
| **Kalıcılık** | ⏱️ Geçici (TTL ile) | ✅ Kalıcı |
| **Veri Yapıları** | String, List, Set, Hash | JSON, Document, Table |
| **Kullanım** | Cache, Session, Counter | Ana veri deposu |

**Kural:** 
- Redis = Hızlı, geçici, sık erişilen veriler
- MongoDB = Ana veri deposu, kalıcı, tüm veriler

---

## 🎓 Pratik Örnek: Sosyal Medya Uygulamanızda

### Senaryo 1: Feed Gösterimi
```
Kullanıcı: Feed'imi göster
↓
1. Redis'e bak: feed:user123 var mı? → YOK
2. MongoDB'den al: Karmaşık sorgu çalıştır (500ms)
3. Redis'e kaydet: feed:user123 = [post1, post2, ...] (5 dakika TTL)
4. Kullanıcıya göster

2 dakika sonra kullanıcı tekrar feed'e baksın:
1. Redis'e bak: feed:user123 var mı? → EVET! ✅
2. Redis'ten direkt al (5ms) ⚡
3. Kullanıcıya göster

SONUÇ: 500ms → 5ms (100x daha hızlı!)
```

### Senaryo 2: Bildirim Sayısı
```
Kullanıcı: Kaç okunmamış bildirimim var?
↓
1. Redis'e bak: notifications:unread:user123 = 5
2. Hemen göster (2ms) ⚡

Yeni bildirim geldi:
1. MongoDB'ye kaydet
2. Redis'teki sayacı artır: notifications:unread:user123 = 6 (1ms)
3. Kullanıcıya göster

Kullanıcı bildirimi okudu:
1. MongoDB'de read = true yap
2. Redis'teki sayacı azalt: notifications:unread:user123 = 5 (1ms)
```

---

## 🔑 Redis Temel Komutlar (Basit Örnekler)

### String İşlemleri
```typescript
// Veri kaydet (5 dakika TTL ile)
await redis.setex('key', 300, 'value');

// Veri oku
const value = await redis.get('key');

// Veri sil
await redis.del('key');
```

### Counter İşlemleri
```typescript
// Sayacı artır
await redis.incr('counter'); // 0 → 1 → 2 → 3

// Sayacı azalt
await redis.decr('counter'); // 3 → 2 → 1

// Belirli miktar artır
await redis.incrby('counter', 5); // 1 → 6
```

### List İşlemleri (Queue için)
```typescript
// Kuyruğa ekle (sola)
await redis.lpush('queue', 'item1');

// Kuyruktan al (sağdan)
const item = await redis.rpop('queue');
```

---

## ⚠️ Önemli Notlar

### 1. **TTL (Time To Live) Kullanın**
```typescript
// ❌ YANLIŞ: TTL olmadan cache → Memory dolar
await redis.set('key', 'value');

// ✅ DOĞRU: TTL ile cache → Otomatik silinir
await redis.setex('key', 300, 'value'); // 5 dakika
```

### 2. **Cache Invalidation (Cache Temizleme)**
Veri değiştiğinde cache'i temizlemeyi unutmayın:
```typescript
// Post güncellendiğinde
await redis.del(`post:${postId}`);
await redis.del(`feed:${userId}:*`); // Feed cache'lerini de temizle
```

### 3. **Memory Yönetimi**
Redis RAM'de çalışır, dikkatli kullanın:
- Gereksiz cache yapmayın
- TTL değerlerini akıllıca seçin
- Memory limit koyun: `maxmemory-policy allkeys-lru`

---

## 📊 Performans Karşılaştırması

### Redis (RAM'de)
- Okuma: ~0.1ms (mikrosaniye)
- Yazma: ~0.1ms
- **10,000+ işlem/saniye** ⚡

### MongoDB (Disk'te)
- Okuma: ~5-50ms
- Yazma: ~10-100ms
- **100-1,000 işlem/saniye** 🐢

**Sonuç:** Redis, MongoDB'den **10-100x daha hızlı** ama **sınırlı kapasite** ile!

---

## 🎯 Özet: Redis Ne Zaman Kullanılmalı?

### ✅ Redis Kullan:
- Sık erişilen veriler (feed, profil, bildirim)
- Geçici veriler (session, token)
- Hızlı sayaçlar (like, view, notification count)
- Rate limiting
- Real-time özellikler (online status)
- Cache ihtiyacı olan her yerde

### ❌ Redis Kullanma:
- Ana veri deposu (kalıcı veriler için)
- Büyük dosyalar (video, resim)
- Çok nadir erişilen veriler
- Kritik finansal işlemler (Redis geçici olabilir)

---

## 🚀 Sizin Projenizde Öncelikli Kullanım Alanları

1. **Feed Cache** → En büyük performans kazancı
2. **Refresh Token Storage** → Güvenlik + Hız
3. **Rate Limiting** → API koruması
4. **Notification Count** → Gerçek zamanlı sayaç
5. **User Profile Cache** → Sık erişilen veriler

Detaylı implementasyon için `REDIS_KULLANIM_KILAVUZU.md` dosyasına bakın!

---

## 💡 Sonuç

Redis, uygulamanızı **çok daha hızlı** hale getiren bir araçtır. Doğru kullanıldığında:

- ✅ Kullanıcı deneyimi iyileşir (daha hızlı yükleme)
- ✅ Sunucu yükü azalır (daha az DB sorgusu)
- ✅ Maliyet düşer (daha az sunucu kaynağı)
- ✅ Ölçeklenebilirlik artar (daha fazla kullanıcı)

**Teknik olarak:** Redis, veritabanınızın hızlı "yardımcısı"dır. Ana veri MongoDB'de, sık kullanılan veriler Redis'te! 🚀






