import { execFile } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Günlük PostgreSQL veritabanı yedeğini pg_dump ile alır, gzip ile sıkıştırır,
 * BACKUP_ENCRYPTION_KEY tanımlıysa AES-256-GCM ile şifreler ve Cloudflare R2 private bucket'ına yükler.
 * Son 14 gün dışındaki eski yedekleri otomatik olarak temizler.
 */
async function signAndRequestR2(params: {
  method: 'PUT' | 'GET' | 'DELETE';
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  objectKey?: string;
  queryString?: string;
  body?: Buffer;
  contentType?: string;
}): Promise<Response> {
  const host = `${params.accountId}.r2.cloudflarestorage.com`;
  const keyPart = params.objectKey
    ? `/${params.objectKey.split('/').map(encodeURIComponent).join('/')}`
    : '';
  const query = params.queryString ? `?${params.queryString}` : '';
  const endpoint = `https://${host}/${params.bucketName}${keyPart}${query}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';

  const bodyBuf = params.body || Buffer.alloc(0);
  const payloadHash = crypto.createHash('sha256').update(bodyBuf).digest('hex');

  const headersList: Array<[string, string]> = [
    ['host', host],
    ['x-amz-content-sha256', payloadHash],
    ['x-amz-date', amzDate],
  ];
  if (params.contentType) {
    headersList.unshift(['content-type', params.contentType]);
  }
  headersList.sort((a, b) => a[0].localeCompare(b[0]));

  const canonicalHeaders = headersList.map(([k, v]) => `${k}:${v}\n`).join('');
  const signedHeaders = headersList.map(([k]) => k).join(';');
  const canonicalUri = `/${params.bucketName}${keyPart}`;

  const canonicalRequest = [
    params.method,
    canonicalUri,
    params.queryString || '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');

  const hmac = (key: Buffer | string, data: string) =>
    crypto.createHmac('sha256', key).update(data).digest();

  const kDate = hmac(`AWS4${params.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${params.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const fetchHeaders: Record<string, string> = {
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    Authorization: authorization,
  };
  if (params.contentType) {
    fetchHeaders['Content-Type'] = params.contentType;
  }

  return fetch(endpoint, {
    method: params.method,
    headers: fetchHeaders,
    body: params.method === 'PUT' ? new Uint8Array(bodyBuf) : undefined,
  });
}

async function runBackup() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const backupBucket = process.env.R2_BACKUP_BUCKET_NAME || 'civarimda-backups';
  const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || '14');

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2_ACCOUNT_ID, R2_ACCESS_KEY_ID ve R2_SECRET_ACCESS_KEY zorunludur.');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const tmpSqlPath = path.join(process.cwd(), `tmp-backup-${timestamp}.sql`);

  const dbUrl = process.env.DATABASE_URL;
  const pgArgs = dbUrl
    ? [dbUrl, '-F', 'p', '-f', tmpSqlPath]
    : [
        '-h',
        process.env.POSTGRES_HOST || 'localhost',
        '-p',
        process.env.POSTGRES_PORT || '5432',
        '-U',
        process.env.POSTGRES_USERNAME || 'postgres',
        '-d',
        process.env.POSTGRES_DATABASE || 'civarimda',
        '-F',
        'p',
        '-f',
        tmpSqlPath,
      ];

  console.log('🗄️ PostgreSQL yedeği alınıyor...');
  await execFileAsync('pg_dump', pgArgs, {
    env: {
      ...process.env,
      PGPASSWORD: process.env.POSTGRES_PASSWORD || 'postgres',
    },
  });

  const rawSql = await fs.promises.readFile(tmpSqlPath);
  fs.unlink(tmpSqlPath, () => {});

  let payload: Buffer = zlib.gzipSync(rawSql);
  let objectKey = `pg-backups/civarimda-${timestamp}.sql.gz`;

  // İsteğe bağlı AES-256-GCM şifreleme (BACKUP_ENCRYPTION_KEY varsa)
  const encKeyHex = process.env.BACKUP_ENCRYPTION_KEY;
  if (encKeyHex) {
    const key = crypto.createHash('sha256').update(encKeyHex).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
    const tag = cipher.getAuthTag();
    payload = Buffer.concat([iv, tag, encrypted]);
    objectKey += '.enc';
  }

  const uploadRes = await signAndRequestR2({
    method: 'PUT',
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName: backupBucket,
    objectKey,
    body: payload,
    contentType: 'application/octet-stream',
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => '');
    throw new Error(`R2 yedek yükleme başarısız (${uploadRes.status}): ${errText}`);
  }
  console.log(`✅ Yedek R2'ya yüklendi: ${backupBucket}/${objectKey} (${payload.length} bayt)`);

  // 14 günden eski yedekleri temizle
  const listRes = await signAndRequestR2({
    method: 'GET',
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName: backupBucket,
    queryString: 'list-type=2&prefix=pg-backups%2F',
  });

  if (listRes.ok) {
    const xml = await listRes.text();
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const keyMatches = [...xml.matchAll(/<Key>([^<]+)<\/Key>[\s\S]*?<LastModified>([^<]+)<\/LastModified>/g)];
    for (const match of keyMatches) {
      const oldKey = match[1];
      const modifiedAt = new Date(match[2]).getTime();
      if (Number.isFinite(modifiedAt) && modifiedAt < cutoff) {
        await signAndRequestR2({
          method: 'DELETE',
          accountId,
          accessKeyId,
          secretAccessKey,
          bucketName: backupBucket,
          objectKey: oldKey,
        });
        console.log(`🧹 Eski yedek silindi: ${oldKey}`);
      }
    }
  }
}

runBackup().catch((err) => {
  console.error('❌ Yedekleme hatası:', err);
  process.exit(1);
});

