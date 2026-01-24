# Log Dosyaları Kullanım Kılavuzu

## 📁 Log Dosya Konumları

Log dosyaları `1_backend/logs/` klasöründe saklanır:

- **`logs/combined.log`** - Tüm loglar (info, warn, error, debug)
- **`logs/error.log`** - Sadece error seviyesindeki loglar

## 🔍 Log Dosyalarını Görüntüleme

### Windows PowerShell

```powershell
# Tüm logları canlı takip et (tail -f benzeri)
Get-Content logs/combined.log -Wait -Tail 50

# Son 100 satırı görüntüle
Get-Content logs/combined.log -Tail 100

# Sadece hataları görüntüle
Get-Content logs/error.log -Wait -Tail 50

# Belirli bir kelimeyi ara
Select-String -Path logs/combined.log -Pattern "SECURITY"

# JSON formatında okumak için
Get-Content logs/combined.log | ConvertFrom-Json
```

### Linux/Mac Terminal

```bash
# Tüm logları canlı takip et
tail -f logs/combined.log

# Son 100 satırı görüntüle
tail -n 100 logs/combined.log

# Sadece hataları görüntüle
tail -f logs/error.log

# Belirli bir tarih aralığındaki logları filtrele
grep "2024-01-15" logs/combined.log

# Security event'leri görüntüle
grep "SECURITY" logs/combined.log

# JSON formatında okumak için (jq gerekli)
cat logs/combined.log | jq .

# Hata sayısını say
grep -c "error" logs/combined.log
```

## 📊 Log Seviyeleri

Winston logger şu seviyeleri kullanır:

- **error**: Kritik hatalar (sadece error.log'a yazılır)
- **warn**: Uyarılar (security event'ler dahil)
- **info**: Bilgilendirme mesajları
- **debug**: Debug mesajları (sadece development'ta)

## 🔒 Security Event Logları

Security event'ler `[SECURITY]` etiketi ile loglanır:

- Failed login attempts
- Invalid refresh token attempts
- Unauthorized access attempts
- Rate limit violations

**Örnek Security Log:**
```json
{
  "level": "warn",
  "message": "[SECURITY] Failed login attempt",
  "email": "user@example.com",
  "reason": "Invalid password",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "context": "Security"
}
```

## 📈 Log Analizi

### En Çok Hata Veren Endpoint'leri Bulma

```bash
# Windows PowerShell
Select-String -Path logs/error.log -Pattern "GET|POST|PUT|DELETE" | Group-Object | Sort-Object Count -Descending

# Linux/Mac
grep -oE "(GET|POST|PUT|DELETE) [^ ]+" logs/error.log | sort | uniq -c | sort -rn
```

### Günlük Hata Sayısını Bulma

```bash
# Windows PowerShell
Select-String -Path logs/error.log -Pattern "2024-01-15" | Measure-Object | Select-Object Count

# Linux/Mac
grep -c "2024-01-15" logs/error.log
```

### Security Event'leri Analiz Etme

```bash
# Windows PowerShell
Select-String -Path logs/combined.log -Pattern "SECURITY" | Select-Object -First 20

# Linux/Mac
grep "SECURITY" logs/combined.log | head -20
```

## 🛠️ Log Rotation (Opsiyonel)

Log dosyaları büyüdükçe disk alanı kaplayabilir. Log rotation için:

1. **winston-daily-rotate-file** paketi kullanılabilir
2. Veya sistem seviyesinde logrotate kullanılabilir
3. Eski loglar otomatik silinebilir veya arşivlenebilir

## 📝 Notlar

- Log dosyaları JSON formatında saklanır (structured logging)
- Production'da log seviyesi `info` olarak ayarlanır
- Development'ta log seviyesi `debug` olarak ayarlanır
- Log dosyaları `.gitignore`'a eklenmelidir (production'da)

