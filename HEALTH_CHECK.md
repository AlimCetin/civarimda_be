# 🏥 Health Check & Performance Monitoring

Tosyam Backend, sistem sağlığını ve performansını izlemek için health check endpoint'leri sunar.

## 📡 Endpoints

### 1. Basic Health Check

**Endpoint:** `GET /health`

Basit bir health check. Servisin çalışıp çalışmadığını kontrol eder.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T14:30:22.123Z",
  "uptime": 3600.5,
  "environment": "production"
}
```

**Kullanım:**
```bash
curl http://localhost:3000/health
```

**Use Cases:**
- Load balancer health checks
- Kubernetes liveness probes
- Uptime monitoring services
- Simple status checks

---

### 2. Detailed Health Check

**Endpoint:** `GET /health/detailed`

Detaylı sağlık kontrolü. Database ve Redis bağlantı durumlarını içerir.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T14:30:22.123Z",
  "uptime": 3600.5,
  "uptimeReadable": "1h 0m 0s",
  "environment": "production",
  "services": {
    "database": {
      "status": "up",
      "state": "connected",
      "host": "localhost",
      "name": "tosyam"
    },
    "redis": {
      "status": "up",
      "state": "ready",
      "response": "PONG"
    }
  },
  "system": {
    "nodeVersion": "v20.10.0",
    "platform": "linux",
    "arch": "x64",
    "pid": 12345,
    "memory": {
      "total": "150.25 MB",
      "heapUsed": "85.50 MB",
      "heapTotal": "120.00 MB"
    }
  }
}
```

**Status Values:**
- `healthy`: Tüm servisler çalışıyor
- `degraded`: Bir veya daha fazla servis çalışmıyor

**Kullanım:**
```bash
curl http://localhost:3000/health/detailed
```

**Use Cases:**
- Kubernetes readiness probes
- Detailed monitoring dashboards
- Debugging connection issues
- Service dependency checks

---

### 3. Performance Metrics

**Endpoint:** `GET /health/metrics`

Performans metrikleri. Memory, CPU, database istatistikleri.

**Response:**
```json
{
  "timestamp": "2024-01-15T14:30:22.123Z",
  "uptime": 3600.5,
  "uptimeReadable": "1h 0m 0s",
  "memory": {
    "rss": "150.25 MB",
    "heapTotal": "120.00 MB",
    "heapUsed": "85.50 MB",
    "external": "2.50 MB",
    "arrayBuffers": "1.25 MB"
  },
  "cpu": {
    "user": 5000000,
    "system": 1000000
  },
  "process": {
    "pid": 12345,
    "version": "v20.10.0",
    "platform": "linux",
    "arch": "x64"
  },
  "database": {
    "collections": 8,
    "dataSize": "50.25 MB",
    "indexSize": "10.50 MB",
    "storageSize": "60.75 MB",
    "indexes": 15
  }
}
```

**Kullanım:**
```bash
curl http://localhost:3000/health/metrics
```

**Use Cases:**
- Performance monitoring
- Resource usage tracking
- Capacity planning
- Debugging memory leaks

---

## 🐳 Docker Health Checks

Docker Compose'da health check kullanımı:

```yaml
services:
  backend:
    image: tosyam-backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## ☸️ Kubernetes Health Checks

Kubernetes deployment'ta health check kullanımı:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: tosyam-backend
spec:
  containers:
  - name: backend
    image: tosyam-backend
    livenessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /health/detailed
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 3
```

### Probe Açıklamaları:

- **Liveness Probe**: Servisin çalışıp çalışmadığını kontrol eder. Başarısız olursa pod yeniden başlatılır.
  - `/health` endpoint'ini kullan (hızlı, basit)
  
- **Readiness Probe**: Servisin istekleri kabul edip edemeyeceğini kontrol eder. Başarısız olursa pod trafikten çıkarılır.
  - `/health/detailed` endpoint'ini kullan (database ve Redis kontrolü ile)

## 📊 Monitoring Services Entegrasyonu

### 1. Uptime Robot

1. https://uptimerobot.com adresine gidin
2. "Add New Monitor" → "HTTP(s)"
3. URL: `https://your-domain.com/health`
4. Monitoring interval: 5 minutes

### 2. Pingdom

1. https://www.pingdom.com adresine gidin
2. "Add Check" → "Uptime"
3. URL: `https://your-domain.com/health`
4. Check interval: 1 minute

### 3. Prometheus

Prometheus için custom exporter veya `/health/metrics` endpoint'ini scrape edebilirsiniz.

**prometheus.yml:**
```yaml
scrape_configs:
  - job_name: 'tosyam-backend'
    scrape_interval: 15s
    metrics_path: '/health/metrics'
    static_configs:
      - targets: ['localhost:3000']
```

### 4. Grafana

Grafana'da Prometheus datasource'u ekleyip metrics'leri görselleştirebilirsiniz.

## 🔔 Alerting Rules

### Prometheus Alert Rules

**alerts.yml:**
```yaml
groups:
  - name: tosyam-backend
    rules:
      - alert: ServiceDown
        expr: up{job="tosyam-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Tosyam Backend is down"
          description: "Backend service has been down for more than 1 minute"
      
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes{job="tosyam-backend"} > 500000000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 500MB for 5 minutes"
      
      - alert: DatabaseDown
        expr: database_status{job="tosyam-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection lost"
          description: "MongoDB connection has been down for 1 minute"
```

## 🧪 Testing

### Manual Testing

```bash
# Basic health check
curl http://localhost:3000/health

# Detailed health check
curl http://localhost:3000/health/detailed | jq

# Performance metrics
curl http://localhost:3000/health/metrics | jq

# Check specific service status
curl http://localhost:3000/health/detailed | jq '.services.database.status'
```

### Automated Testing

```typescript
// health.e2e.spec.ts
describe('Health Check (e2e)', () => {
  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.uptime).toBeGreaterThan(0);
      });
  });

  it('/health/detailed (GET)', () => {
    return request(app.getHttpServer())
      .get('/health/detailed')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('healthy');
        expect(res.body.services.database.status).toBe('up');
        expect(res.body.services.redis.status).toBe('up');
      });
  });
});
```

## 📈 Metrics Açıklamaları

### Memory Metrics

- **RSS (Resident Set Size)**: Toplam RAM kullanımı
- **Heap Total**: V8'in tahsis ettiği toplam heap memory
- **Heap Used**: Kullanılan heap memory
- **External**: V8 dışı C++ nesnelerin memory kullanımı
- **Array Buffers**: Buffer nesnelerinin memory kullanımı

### CPU Metrics

- **User**: User-space CPU time (microseconds)
- **System**: Kernel CPU time (microseconds)

### Database Metrics

- **Collections**: Toplam collection sayısı
- **Data Size**: Toplam data boyutu
- **Index Size**: Toplam index boyutu
- **Storage Size**: Disk'te kullanılan toplam alan
- **Indexes**: Toplam index sayısı

## 🛡️ Security

Health check endpoint'leri **kimlik doğrulama gerektirmez**. Bu:
- ✅ Load balancer'ların kolayca erişebilmesi için gerekli
- ✅ Kubernetes probe'larının çalışması için gerekli
- ⚠️ Ancak hassas bilgi içerebilir

**Güvenlik Önerileri:**

1. Production'da `/health/detailed` ve `/health/metrics` endpoint'lerini internal network'e kısıtlayın
2. Sadece `/health` endpoint'ini public'te bırakın
3. Rate limiting uygulayın (zaten aktif)
4. Firewall kuralları ile IP kısıtlaması yapın

**Nginx Örneği:**
```nginx
location /health/detailed {
  allow 10.0.0.0/8;  # Internal network
  allow 127.0.0.1;    # Localhost
  deny all;
  proxy_pass http://backend:3000;
}

location /health/metrics {
  allow 10.0.0.0/8;
  deny all;
  proxy_pass http://backend:3000;
}

location /health {
  # Public endpoint
  proxy_pass http://backend:3000;
}
```

## 🔧 Troubleshooting

### Database Status "down"

```bash
# Check MongoDB connection
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Test MongoDB connection
mongosh mongodb://localhost:27017/tosyam
```

### Redis Status "down"

```bash
# Check Redis connection
docker-compose ps redis

# Check Redis logs
docker-compose logs redis

# Test Redis connection
redis-cli ping
```

### High Memory Usage

```bash
# Check memory metrics
curl http://localhost:3000/health/metrics | jq '.memory'

# Restart application if needed
pm2 restart tosyam-backend

# Or with Docker
docker-compose restart backend
```

---

**Not**: Health check endpoint'leri production'da monitoring ve alerting için kritiktir. Mutlaka uptime monitoring servisleri ile entegre edin.

