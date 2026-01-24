import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

export const multerConfig = {
    storage: diskStorage({
        destination: (req, file, cb) => {
            // Video veya resim klasörünü belirle
            const folderName = file.mimetype.startsWith('video/') ? 'uploads/videos' : 'uploads/images';
            const uploadPath = join(process.cwd(), folderName);

            // Klasör yoksa oluştur
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }

            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            // Benzersiz dosya adı oluştur: timestamp-random.ext
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = extname(file.originalname);
            cb(null, `${uniqueSuffix}${ext}`);
        },
    }),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB maksimum dosya boyutu
    },
    fileFilter: (req, file, cb) => {
        // Sadece video ve resim dosyalarına izin ver
        const allowedMimeTypes = [
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only videos and images are allowed.'), false);
        }
    },
};
