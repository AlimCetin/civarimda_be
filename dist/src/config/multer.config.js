"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerConfig = void 0;
const multer_1 = require("multer");
const path_1 = require("path");
exports.multerConfig = {
    storage: (0, multer_1.diskStorage)({
        destination: (req, file, cb) => {
            const folder = file.mimetype.startsWith('video/') ? 'uploads/videos' : 'uploads/images';
            cb(null, folder);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = (0, path_1.extname)(file.originalname);
            cb(null, `${uniqueSuffix}${ext}`);
        },
    }),
    limits: {
        fileSize: 50 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
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
        }
        else {
            cb(new Error('Invalid file type. Only videos and images are allowed.'), false);
        }
    },
};
//# sourceMappingURL=multer.config.js.map