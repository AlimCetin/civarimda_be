# 🚨 Alerting System Kurulum Kılavuzu

Tosyam Backend, kritik hatalar ve güvenlik olayları için Discord veya Slack webhook entegrasyonu ile otomatik bildirim sistemi sunar.

## 🎯 Ne Zaman Bildirim Gönderilir?

Aşağıdaki durumlarda otomatik bildirim gönderilir:

### 🔴 Error Seviyesi (Kritik):
- Beklenmeyen uygulama hataları
- Database bağlantı hataları
- External API çağrı hataları
- Unhandled exceptions

### ⚠️ Warning Seviyesi (Güvenlik):
- Başarısız login denemeleri
- Geçersiz refresh token kullanımı
- Yetkisiz erişim denemeleri
- Rate limit aşımları
- Suspicious activity (şüpheli aktiviteler)

## 📱 Discord Webhook Kurulumu

### Adım 1: Discord Webhook Oluştur

1. Discord sunucunuzda **Sunucu Ayarları** → **Entegrasyonlar** → **Webhook'lar**'a gidin
2. **Yeni Webhook** butonuna tıklayın
3. Webhook için bir isim verin (örn: "Tosyam Alerts")
4. Bildirimlerin gönderileceği kanalı seçin
5. **Webhook URL'sini Kopyala** butonuna tıklayın

### Adım 2: Environment Variable Ekle

`.env` dosyanıza aşağıdaki satırları ekleyin:

```env
# Discord Webhook
ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz
ALERT_WEBHOOK_TYPE=discord
```

### Adım 3: Uygulamayı Yeniden Başlat

```bash
npm run start:dev
```

## 💬 Slack Webhook Kurulumu

### Adım 1: Slack App Oluştur

1. https://api.slack.com/apps adresine gidin
2. **Create New App** → **From scratch**
3. App ismi verin (örn: "Tosyam Alerts") ve workspace seçin
4. **Incoming Webhooks** → **Activate Incoming Webhooks** (ON)
5. **Add New Webhook to Workspace**
6. Bildirimlerin gönderileceği kanalı seçin
7. **Webhook URL**'i kopyalayın

### Adım 2: Environment Variable Ekle

`.env` dosyanıza aşağıdaki satırları ekleyin:

```env
# Slack Webhook
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
ALERT_WEBHOOK_TYPE=slack
```

### Adım 3: Uygulamayı Yeniden Başlat

```bash
npm run start:dev
```

## 🧪 Test Etme

Alerting sistemini test etmek için bir hata logunu tetikleyebilirsiniz:

```typescript
// Herhangi bir service'de
this.logger.error('Test alert message', 'Test error stack trace', 'TestContext');

// veya security event
this.logger.securityEvent('Test Security Event', {
  userId: 'test123',
  action: 'test_action',
  ip: '127.0.0.1'
});
```

## 📋 Bildirim Formatı

### Discord Bildirimi İçeriği:
```
🔴 ERROR Alert
Message: Database connection failed

Timestamp: 2024-01-15 14:30:22
Environment: production

Context: {
  "error": "Connection timeout",
  "database": "mongodb"
}

Stack Trace:
Error: Connection timeout
  at Database.connect (database.ts:45)
  ...
```

### Slack Bildirimi İçeriği:
Benzer format, Slack'in attachment formatında

## 🎛️ Özelleştirme

### Webhook Transport Ayarları

`src/common/logger/logger.service.ts` dosyasında:

```typescript
new WebhookTransport({
  webhookUrl: process.env.ALERT_WEBHOOK_URL,
  webhookType: 'discord', // veya 'slack'
  level: 'warn', // Minimum log seviyesi (warn = warn + error)
  appName: 'Tosyam Backend',
})
```

### Log Seviyeleri

- `error`: Kritik hatalar (her zaman gönderilir)
- `warn`: Uyarılar ve güvenlik olayları (her zaman gönderilir)
- `info`: Bilgilendirme (gönderilmez)
- `debug`: Debug mesajları (gönderilmez)

### Sadece Production'da Aktif Etme

```typescript
// logger.service.ts içinde
if (webhookUrl && isProduction) {
  transports.push(new WebhookTransport({...}));
}
```

## 🔕 Alerting'i Devre Dışı Bırakma

`.env` dosyasından `ALERT_WEBHOOK_URL` satırını silin veya yorum satırı yapın:

```env
# ALERT_WEBHOOK_URL=https://...
```

Webhook URL yoksa sistem otomatik olarak devre dışı kalır.

## 🛡️ Güvenlik Notları

1. **Webhook URL'lerini asla public repository'lere commit etmeyin**
2. Webhook URL'ler hassas bilgi içerir, güvenli tutun
3. `.env` dosyası `.gitignore`'da olmalı
4. Production webhook'ları sadece production environment'da kullanın
5. Development ve production için farklı webhook'lar kullanın

## 📊 Monitoring Dashboard (İleri Seviye)

Daha gelişmiş monitoring için:

- **Sentry**: Error tracking ve performance monitoring
- **DataDog**: APM ve infrastructure monitoring
- **New Relic**: Full-stack observability
- **Grafana + Prometheus**: Metrik visualisation

Bu araçlar webhook sistemine ek olarak kullanılabilir.

## 🐛 Sorun Giderme

### Bildirimler Gelmiyor

1. Webhook URL'in doğru olduğundan emin olun
2. Environment variable'ların yüklendiğini kontrol edin:
   ```bash
   echo $ALERT_WEBHOOK_URL
   ```
3. Uygulamayı yeniden başlatın
4. Test log'u gönderin
5. Console'da webhook hatası olup olmadığını kontrol edin

### Çok Fazla Bildirim Geliyor

1. Log seviyesini `error` olarak ayarlayın (sadece kritik hatalar):
   ```typescript
   level: 'error'
   ```
2. Rate limiting ekleyin (örn: dakikada max 10 bildirim)
3. Sadece production'da aktif edin

### Webhook Rate Limit

Discord ve Slack webhook'ları rate limit'e sahiptir:
- **Discord**: 30 request / dakika
- **Slack**: Varies by workspace plan

Çok fazla log gönderirseniz rate limit'e takılabilirsiniz. Production'da dikkatli kullanın.

## 📝 Örnek Kullanım

```typescript
// auth.service.ts
try {
  const user = await this.validateUser(email, password);
} catch (error) {
  // Bu otomatik olarak webhook'a gönderilir
  this.logger.error(
    'Login failed',
    error.stack,
    'AuthService'
  );
  
  // Güvenlik event'i için
  this.logger.securityEvent('Failed Login Attempt', {
    email,
    ip: request.ip,
    userAgent: request.headers['user-agent']
  });
}
```

---

**Not**: Bu sistem basit bir alerting çözümüdür. Production ortamları için daha gelişmiş monitoring ve alerting araçları (Sentry, DataDog, vb.) önerilir.

