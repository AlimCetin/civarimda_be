# Redis Veri mi Sorgu mu Saklar? 🤔

## 🎯 Kısa Cevap

**Redis VERİ saklar, sorgu saklamaz!**

Redis bir **veri deposu**dur. Sorgu (query) değil, sorgunun **sonucunu** (result/data) saklar.

---

## 📚 Detaylı Açıklama

### ❌ YANLIŞ ANLAYIŞ: Redis Sorgu Saklar
```typescript
// ❌ BÖYLE BİR ŞEY YOK!
redis.save('sorgu:findPosts', 'SELECT * FROM posts WHERE userId = 123');
// Bu çalışmaz, Redis sorgu saklamaz!
```

### ✅ DOĞRU: Redis Veri (Sorgu Sonucu) Saklar
```typescript
// ✅ DOĞRU KULLANIM
// 1. Önce sorguyu çalıştır (MongoDB'de)
const posts = await db.posts.find({ userId: 123 }); // Sorgu burada çalışır

// 2. Sorgu sonucunu (VERİYİ) Redis'e kaydet
await redis.setex(`posts:user:123`, 300, JSON.stringify(posts)); // VERİ saklanır

// 3. Bir sonraki sefer direkt VERİYİ Redis'ten al (sorgu çalışmaz)
const cachedPosts = await redis.get(`posts:user:123`); // VERİ okunur
```

---

## 🔍 Gerçek Hayat Örneği: Sizin getFeed() Metodunuz

### Şu Anki Durum (Redis Olmadan)

```typescript
// src/posts/posts.service.ts - getFeed() metodu
async getFeed(userId: string, page: number = 1, limit: number = 20) {
  // ❌ HER ÇAĞRILDIĞINDA BU SORGULAR ÇALIŞIR:
  
  // 1. Kullanıcıyı bul
  const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
  
  // 2. Blocked users sorgusu
  const usersWhoBlockedMe = await this.userModel.find({
    _id: { $in: following },
    blockedUsers: userId,
    deletedAt: null,
  });
  
  // 3. Post sorgusu (en ağır)
  const posts = await this.postModel.find({ 
    userId: { $in: finalFollowing },
    deletedAt: null,
    // ... kompleks filtreler
  })
    .populate('userId', 'fullName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(maxLimit)
    .lean();
  
  // 4. Format ve filtreleme işlemleri
  // ...
  
  return { posts: result, pagination: {...} };
}
```

**Sorun:** Her istekte tüm bu sorgular MongoDB'de çalışır → **500ms** ⏱️

---

### Redis ile Çözüm (VERİ Saklama)

```typescript
async getFeed(userId: string, page: number = 1, limit: number = 20) {
  // 1. ÖNCE REDIS'E BAK: VERİ VAR MI?
  const cacheKey = `feed:${userId}:${page}:${limit}`;
  const cachedData = await redis.get(cacheKey);
  
  if (cachedData) {
    // ✅ VERİ REDIS'TE VAR - SORGU ÇALIŞTIRMA!
    console.log('✅ Cache hit - Veri Redis\'ten geldi');
    return JSON.parse(cachedData); // Direkt VERİ döndür (5ms) ⚡
  }
  
  // 2. REDIS'TE VERİ YOK - SORGUYU ÇALIŞTIR
  console.log('❌ Cache miss - MongoDB sorgusu çalışıyor...');
  
  // Şimdi yukarıdaki sorguları çalıştır (500ms)
  const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
  const usersWhoBlockedMe = await this.userModel.find({...});
  const posts = await this.postModel.find({...}).lean();
  
  // Format ve filtreleme
  const result = { posts: formattedPosts, pagination: {...} };
  
  // 3. SORGU SONUCUNU (VERİYİ) REDIS'E KAYDET
  await redis.setex(
    cacheKey, 
    300, // 5 dakika TTL
    JSON.stringify(result) // VERİ burada saklanır (sorgu değil!)
  );
  
  console.log('💾 Veri Redis\'e kaydedildi');
  return result;
}
```

**Sonuç:** 
- İlk istek: Sorgu çalışır → **500ms** → Veri Redis'e kaydedilir
- İkinci istek: Sorgu çalışmaz → **5ms** → Veri Redis'ten okunur

---

## 📊 Karşılaştırma Tablosu

| Özellik | MongoDB | Redis |
|---------|---------|-------|
| **Sorgu Çalıştırır mı?** | ✅ Evet (SQL/NoSQL sorguları) | ❌ Hayır |
| **Veri Saklar mı?** | ✅ Evet (ana veri deposu) | ✅ Evet (cache/geçici) |
| **Nasıl Çalışır?** | Sorgu yaz → Sorguyu çalıştır → Sonuç döndür | Key ver → Veriyi döndür |
| **Örnek** | `db.find({userId: 123})` | `redis.get('user:123')` |

---

## 🎓 Daha İyi Anlamak İçin Örnekler

### Örnek 1: Kullanıcı Profili

```typescript
// ❌ YANLIŞ: Redis'te sorgu saklamak (bu çalışmaz!)
await redis.set('query', 'db.users.findById(123)'); // Sorgu saklanmaz!

// ✅ DOĞRU: Sorgu sonucunu (veriyi) saklamak
// 1. Sorguyu çalıştır
const user = await db.users.findById(123); // MongoDB'de sorgu çalışır

// 2. Sorgu sonucunu (user verisini) Redis'e kaydet
await redis.setex('user:123', 1800, JSON.stringify(user)); // VERİ saklanır

// 3. Bir sonraki sefer
const cachedUser = await redis.get('user:123'); // VERİ okunur (sorgu yok!)
if (cachedUser) {
  return JSON.parse(cachedUser); // Direkt veri döndür
}
```

### Örnek 2: Bildirim Sayısı

```typescript
// ❌ YANLIŞ: Sorguyu saklamak
await redis.set('query', 'db.notifications.count({read: false})');

// ✅ DOĞRU: Sorgu sonucunu (sayıyı) saklamak
// 1. İlk sefer: Sorguyu çalıştır
const count = await db.notifications.count({read: false, userId: 123});
await redis.setex('notifications:unread:123', 60, count.toString()); // SAYI saklanır

// 2. Yeni bildirim geldiğinde: Redis'teki sayıyı artır (sorgu çalıştırma!)
await redis.incr('notifications:unread:123'); // Direkt sayıyı artır (1ms)

// 3. Bildirim okunduğunda: Redis'teki sayıyı azalt
await redis.decr('notifications:unread:123'); // Direkt sayıyı azalt (1ms)
```

### Örnek 3: Arama Sonuçları

```typescript
async searchUsers(query: string) {
  const cacheKey = `search:users:${query}`;
  
  // 1. Önce Redis'e bak: Arama sonucu (VERİ) var mı?
  const cachedResults = await redis.get(cacheKey);
  if (cachedResults) {
    return JSON.parse(cachedResults); // VERİ döndür (sorgu çalışmaz)
  }
  
  // 2. Redis'te yok: Sorguyu çalıştır
  const results = await db.users.find({
    $or: [
      { username: { $regex: query, $options: 'i' } },
      { fullName: { $regex: query, $options: 'i' } }
    ]
  }); // MongoDB'de sorgu çalışır
  
  // 3. Sorgu sonucunu (results verisini) Redis'e kaydet
  await redis.setex(cacheKey, 300, JSON.stringify(results)); // VERİ saklanır
  
  return results;
}
```

---

## 🔄 İş Akışı: Redis ile Cache Mekanizması

```
┌─────────────────────────────────────────────────────────────┐
│ KULLANICI: Feed'imi göster                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. REDIS'E BAK                                              │
│    Key: "feed:user123:1:20"                                 │
│    Veri var mı?                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
            ┌─────────────┴─────────────┐
            │                           │
        ✅ VAR                       ❌ YOK
            │                           │
            ↓                           ↓
┌───────────────────────┐   ┌──────────────────────────────┐
│ 2A. VERİYİ DÖNDÜR     │   │ 2B. MONGODB SORGUSU ÇALIŞTIR │
│    (5ms) ⚡           │   │    (500ms) ⏱️                │
│                       │   │                              │
│ return cachedData     │   │ const posts = await          │
│                       │   │   db.posts.find({...})       │
└───────────────────────┘   │                              │
                            │ 3. SONUCU REDIS'E KAYDET     │
                            │    await redis.setex(...)     │
                            │                              │
                            │ 4. VERİYİ DÖNDÜR             │
                            └──────────────────────────────┘
```

**Önemli:** 
- Redis'te **sorgu değil**, sorgunun **sonucu (veri)** saklanır
- Redis'e baktığınızda direkt **veri** alırsınız, sorgu çalıştırmazsınız

---

## 🎯 Özet: Redis Nasıl Çalışır?

### Adım 1: İlk İstek (Cache Miss)
```
Kullanıcı → API → Redis'e bak → YOK
         → MongoDB sorgusu çalıştır (500ms)
         → Sorgu sonucunu (VERİYİ) Redis'e kaydet
         → Kullanıcıya veriyi göster
```

### Adım 2: İkinci İstek (Cache Hit)
```
Kullanıcı → API → Redis'e bak → VAR ✅
         → Redis'ten veriyi al (5ms) ⚡
         → MongoDB sorgusu çalıştırma (sorgu yok!)
         → Kullanıcıya veriyi göster
```

---

## 💡 Temel Kural

```
Redis = Key-Value Store
      = Veri Deposu
      = Sorgu Sonucu Depolama Yeri
      ≠ Sorgu Depolama Yeri
```

**Basit Benzetme:**
- **MongoDB sorgusu** = Yemek tarifi (nasıl yapılacağı)
- **Redis'teki veri** = Hazır yemek (sonuç)

Redis'te **hazır yemeği** saklarsınız, **tarifi** değil!

---

## ⚠️ Yaygın Hatalar

### Hata 1: Sorguyu Cache'lemeye Çalışmak
```typescript
// ❌ YANLIŞ
const query = 'db.posts.find({userId: 123})';
await redis.set('query', query); // Bu işe yaramaz!

// ✅ DOĞRU
const result = await db.posts.find({userId: 123}); // Sorguyu çalıştır
await redis.set('posts:user:123', JSON.stringify(result)); // Sonucu sakla
```

### Hata 2: Cache Key'inde Sorgu Kullanmak
```typescript
// ❌ YANLIŞ (ama teknik olarak çalışır)
const cacheKey = `query:${JSON.stringify({userId: 123, page: 1})}`;

// ✅ DOĞRU (anlamlı key)
const cacheKey = `posts:user:123:page:1`;
```

### Hata 3: Her Sorguyu Cache'lemek
```typescript
// ❌ YANLIŞ: Her sorguyu cache'lemek gereksiz
const result = await db.posts.findById('unique-post-id');
await redis.set('post:unique-post-id', JSON.stringify(result)); // Bu nadir erişilir, cache gereksiz

// ✅ DOĞRU: Sık erişilen verileri cache'le
const feed = await db.posts.find({userId: {$in: following}}); // Sık erişilir
await redis.setex(`feed:${userId}`, 300, JSON.stringify(feed)); // Cache mantıklı
```

---

## 🚀 Pratik Kullanım Önerileri

### 1. Cache Key Stratejisi
```typescript
// ✅ İYİ: Anlamlı, hiyerarşik key'ler
'user:123'                    // Kullanıcı profili
'user:123:followers'          // Takipçiler
'feed:123:page:1:limit:20'    // Feed sayfası
'notifications:unread:123'    // Okunmamış bildirim sayısı

// ❌ KÖTÜ: Anlamsız key'ler
'data1'
'cache123'
'temp'
```

### 2. TTL (Time To Live) Kullanımı
```typescript
// ✅ DOĞRU: TTL ile otomatik silme
await redis.setex('feed:123', 300, data); // 5 dakika sonra sil

// ❌ YANLIŞ: TTL olmadan (memory dolar)
await redis.set('feed:123', data); // Sonsuza kadar kalır!
```

### 3. Cache Invalidation
```typescript
// Veri değiştiğinde cache'i temizle
async updatePost(postId: string, data: any) {
  // 1. MongoDB'de güncelle
  await db.posts.updateOne({_id: postId}, data);
  
  // 2. İlgili cache'leri temizle
  await redis.del(`post:${postId}`); // Post cache'i
  await redis.del(`feed:${userId}:*`); // Feed cache'leri (pattern delete)
}
```

---

## 📝 Sonuç

**Redis:**
- ✅ **VERİ saklar** (sorgu sonuçları)
- ❌ **SORGU saklamaz** (SQL/NoSQL sorguları)
- ⚡ **Key-Value** ile çalışır
- 🚀 Sorgu sonuçlarını hızlı erişim için saklar

**Kullanım Mantığı:**
1. MongoDB'de sorguyu çalıştır (yavaş ama kesin veri)
2. Sorgu sonucunu Redis'e kaydet (hızlı erişim için)
3. Bir sonraki sefer Redis'ten oku (çok hızlı!)
4. Veri değiştiğinde cache'i temizle (güncel veri için)

**Özetle:** Redis = **Hazır yemek deposu**, MongoDB = **Mutfak (yemek yapılan yer)** 🍳






