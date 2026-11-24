import * as fs from 'fs';

/**
 * İzin verilen MIME türlerini güvenli dosya uzantılarıyla eşler.
 * İstemciden gelen orijinal dosya uzantısına güvenilmez.
 */
export const SAFE_MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
};

/**
 * Yüklenen dosyanın ilk baytlarını (magic bytes) okuyarak
 * bildirilen MIME türüyle gerçekten uyuşup uyuşmadığını doğrular.
 */
export function verifyFileMagicBytes(filePath: string, mimeType: string): boolean {
  let fd: number | null = null;
  try {
    fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(16);
    const bytesRead = fs.readSync(fd, buffer, 0, 16, 0);
    if (bytesRead < 4) return false;

    switch (mimeType) {
      case 'image/jpeg':
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      case 'image/png':
        return (
          buffer[0] === 0x89 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x4e &&
          buffer[3] === 0x47
        );
      case 'image/gif':
        return buffer.subarray(0, 3).toString('ascii') === 'GIF';
      case 'image/webp':
        return (
          bytesRead >= 12 &&
          buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
          buffer.subarray(8, 12).toString('ascii') === 'WEBP'
        );
      case 'video/mp4':
      case 'video/quicktime':
        // ISO Base Media File Format: 4-7. baytlarda 'ftyp' imzası bulunur
        return bytesRead >= 8 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
      case 'video/x-msvideo':
        return (
          bytesRead >= 12 &&
          buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
          buffer.subarray(8, 12).toString('ascii') === 'AVI '
        );
      default:
        return false;
    }
  } catch {
    return false;
  } finally {
    if (fd !== null) {
      fs.closeSync(fd);
    }
  }
}

