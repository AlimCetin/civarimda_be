import { diskStorage } from 'multer';
import { join } from 'path';
import * as fs from 'fs';
import { SAFE_MIME_EXTENSION_MAP } from '../common/utils/file-signature.util';

export const multerConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      // Video veya resim klasörünü belirle
      const folderName = file.mimetype.startsWith('video/')
        ? 'uploads/videos'
        : 'uploads/images';
      const uploadPath = join(process.cwd(), folderName);

      // Klasör yoksa oluştur
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // İstemciden gelen uzantıya güvenmek yerine MIME eşlemesinden güvenli uzantıyı al
      const safeExt = SAFE_MIME_EXTENSION_MAP[file.mimetype];
      if (!safeExt) {
        return cb(new Error('Geçersiz dosya uzantısı.'), '');
      }
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}${safeExt}`);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB maksimum dosya boyutu
  },
  fileFilter: (req, file, cb) => {
    // Sadece izin verilen video ve resim MIME türlerini kabul et
    if (Object.prototype.hasOwnProperty.call(SAFE_MIME_EXTENSION_MAP, file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Geçersiz dosya türü. Yalnızca izin verilen resim ve video formatları yüklenebilir.'), false);
    }
  },
};
