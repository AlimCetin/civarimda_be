"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./src/entities/user.entity");
const user_credentials_entity_1 = require("./src/entities/user-credentials.entity");
const post_entity_1 = require("./src/entities/post.entity");
const comment_entity_1 = require("./src/entities/comment.entity");
const conversation_entity_1 = require("./src/entities/conversation.entity");
const message_entity_1 = require("./src/entities/message.entity");
const notification_entity_1 = require("./src/entities/notification.entity");
const report_entity_1 = require("./src/entities/report.entity");
const ad_entity_1 = require("./src/entities/ad.entity");
const activity_log_entity_1 = require("./src/entities/activity-log.entity");
const appeal_entity_1 = require("./src/entities/appeal.entity");
const bcrypt = __importStar(require("bcryptjs"));
const dataSource = new typeorm_1.DataSource(process.env.DATABASE_URL
    ? {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [
            user_entity_1.User,
            user_credentials_entity_1.UserCredentials,
            post_entity_1.Post,
            comment_entity_1.Comment,
            conversation_entity_1.Conversation,
            message_entity_1.Message,
            notification_entity_1.Notification,
            report_entity_1.Report,
            appeal_entity_1.Appeal,
            activity_log_entity_1.ActivityLog,
            ad_entity_1.Ad,
        ],
        synchronize: true,
    }
    : {
        type: 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        username: process.env.POSTGRES_USERNAME || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        database: process.env.POSTGRES_DATABASE || 'civarimda',
        entities: [
            user_entity_1.User,
            user_credentials_entity_1.UserCredentials,
            post_entity_1.Post,
            comment_entity_1.Comment,
            conversation_entity_1.Conversation,
            message_entity_1.Message,
            notification_entity_1.Notification,
            report_entity_1.Report,
            appeal_entity_1.Appeal,
            activity_log_entity_1.ActivityLog,
            ad_entity_1.Ad,
        ],
        synchronize: true,
    });
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}
function getRandomElements(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
const captions = [
    'Güzel bir gün! #photography #nature',
    'Yeni tasarım projem üzerinde çalışıyorum 🎨',
    'Harika bir manzara yakaladım! 📸',
    'Bugün okuduğum kitap gerçekten harikaydı 📚',
    'İş hayatından bir kare 💼',
    'Kod yazmak en sevdiğim aktivite 💻',
    'Güzel bir hafta sonu geçirdim 🏞️',
    'Yeni bir proje başlatıyorum! 🚀',
    'Doğanın güzelliği karşısında hayran kaldım 🌲',
    'Sanat eserlerini incelemek büyük keyif 🖼️',
    'Spor yapmak ruhumu dinlendiriyor 🏃',
    'Yemek yapmak benim hobim 👨‍🍳',
    'Müzik dinlemek her zaman iyi gelir 🎵',
    'Gezmeyi seviyorum ✈️',
    'Teknoloji dünyası çok hızlı ilerliyor 📱',
];
const commentTexts = [
    'Harika bir fotoğraf! 👏',
    'Gerçekten çok güzel!',
    'Başarılar dilerim! 🎨',
    'Muhteşem bir manzara!',
    'Fotoğrafçılık yeteneğin gerçekten harika!',
    'Hangi kitap? Merak ettim 📖',
    'Başarılar! 💪',
    'Bende aynı şekilde düşünüyorum!',
    'Çok beğendim! ❤️',
    'Harika görünüyor!',
];
const bios = [
    'Fotoğrafçı & Gezgin 📸✈️',
    'Yazılım Geliştirici 💻',
    'Tasarımcı & Sanatçı 🎨',
    'Kahve sever & Kitap kurdu ☕📚',
    'Müzisyen & Söz yazarı 🎵',
    'Sporcu & Sağlıklı yaşam tutkunu 🏃‍♂️',
];
const postImages = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
];
async function seed() {
    try {
        console.log('PostgreSQL bağlantısı başlatılıyor...');
        await dataSource.initialize();
        console.log('✅ PostgreSQL bağlantısı kuruldu ve tablolar senkronize edildi.');
        const userRepo = dataSource.getRepository(user_entity_1.User);
        const credsRepo = dataSource.getRepository(user_credentials_entity_1.UserCredentials);
        const postRepo = dataSource.getRepository(post_entity_1.Post);
        const commentRepo = dataSource.getRepository(comment_entity_1.Comment);
        const convRepo = dataSource.getRepository(conversation_entity_1.Conversation);
        const msgRepo = dataSource.getRepository(message_entity_1.Message);
        const notifRepo = dataSource.getRepository(notification_entity_1.Notification);
        const reportRepo = dataSource.getRepository(report_entity_1.Report);
        const adRepo = dataSource.getRepository(ad_entity_1.Ad);
        const actRepo = dataSource.getRepository(activity_log_entity_1.ActivityLog);
        const appealRepo = dataSource.getRepository(appeal_entity_1.Appeal);
        console.log('Mevcut veriler temizleniyor...');
        await commentRepo.createQueryBuilder().delete().execute();
        await notifRepo.createQueryBuilder().delete().execute();
        await msgRepo.createQueryBuilder().delete().execute();
        await convRepo.createQueryBuilder().delete().execute();
        await reportRepo.createQueryBuilder().delete().execute();
        await appealRepo.createQueryBuilder().delete().execute();
        await actRepo.createQueryBuilder().delete().execute();
        await adRepo.createQueryBuilder().delete().execute();
        await postRepo.createQueryBuilder().delete().execute();
        await credsRepo.createQueryBuilder().delete().execute();
        await userRepo.createQueryBuilder().delete().execute();
        console.log('✅ Temizlendi.');
        console.log('Kullanıcılar oluşturuluyor...');
        const userData = [
            { fullName: 'Ahmet Yılmaz', email: 'ali@a.com', role: 'admin' },
            { fullName: 'Ayşe Demir', email: 'ali1@a.com', role: 'moderator' },
            { fullName: 'Mehmet Kaya', email: 'mehmet@example.com', role: 'user' },
            { fullName: 'Fatma Özkan', email: 'fatma@example.com', role: 'user' },
            { fullName: 'Ali Şahin', email: 'ali@example.com', role: 'user' },
            { fullName: 'Zeynep Yıldız', email: 'zeynep@example.com', role: 'user' },
            { fullName: 'Mustafa Çelik', email: 'mustafa@example.com', role: 'user' },
            { fullName: 'Elif Arslan', email: 'elif@example.com', role: 'user' },
            { fullName: 'Can Öztürk', email: 'can@example.com', role: 'user' },
            { fullName: 'Dilara Kılıç', email: 'dilara@example.com', role: 'user' },
        ];
        const users = [];
        const hashedPassword = await bcrypt.hash('123456', 12);
        for (let i = 0; i < userData.length; i++) {
            const u = userData[i];
            const user = userRepo.create({
                fullName: u.fullName,
                avatar: `https://i.pravatar.cc/150?img=${i + 1}`,
                bio: bios[i % bios.length],
                isVerified: i % 2 === 0,
                role: u.role,
                warningCount: 0,
                isPermanentlyBanned: false,
                followers: [],
                following: [],
                blockedUsers: [],
                savedPosts: [],
            });
            await userRepo.save(user);
            users.push(user);
            const creds = credsRepo.create({
                userId: user.id,
                email: u.email.toLowerCase(),
                password: hashedPassword,
            });
            await credsRepo.save(creds);
        }
        console.log(`✅ ${users.length} kullanıcı oluşturuldu.`);
        console.log('Takip ilişkileri kuruluyor...');
        for (let i = 0; i < users.length; i++) {
            const otherUsers = users.filter((_, idx) => idx !== i);
            const toFollow = getRandomElements(otherUsers, 3);
            users[i].following = toFollow.map((u) => u.id);
            for (const target of toFollow) {
                target.followers = [...(target.followers || []), users[i].id];
            }
        }
        for (const u of users) {
            await userRepo.save(u);
        }
        console.log('✅ Takip ilişkileri oluşturuldu.');
        console.log('Postlar oluşturuluyor...');
        const posts = [];
        for (const user of users) {
            for (let p = 0; p < 3; p++) {
                const post = postRepo.create({
                    userId: user.id,
                    image: getRandomElement(postImages),
                    caption: getRandomElement(captions),
                    likes: getRandomElements(users, getRandomInt(1, 5)).map((u) => u.id),
                    commentCount: 0,
                    isHidden: false,
                    isPrivate: false,
                });
                await postRepo.save(post);
                posts.push(post);
            }
        }
        console.log(`✅ ${posts.length} post oluşturuldu.`);
        console.log('Yorumlar oluşturuluyor...');
        for (const post of posts) {
            const commentCount = getRandomInt(1, 4);
            for (let c = 0; c < commentCount; c++) {
                const commenter = getRandomElement(users);
                const comment = commentRepo.create({
                    postId: post.id,
                    userId: commenter.id,
                    text: getRandomElement(commentTexts),
                });
                await commentRepo.save(comment);
            }
            post.commentCount = commentCount;
            await postRepo.save(post);
        }
        console.log('✅ Yorumlar oluşturuldu.');
        console.log('Reklamlar oluşturuluyor...');
        const ad = adRepo.create({
            title: 'Civarımda Yöresel Ürünler & Fırsatlar',
            type: ad_entity_1.AdType.IMAGE,
            mediaUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c',
            linkUrl: 'https://civarimda.com',
            description: 'Civarımda lezzetleri bir tık uzağınızda!',
            status: ad_entity_1.AdStatus.ACTIVE,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            createdBy: users[0].id,
            budget: 1000,
            spentAmount: 50,
            clickCount: 15,
            viewCount: 200,
            impressionCount: 350,
        });
        await adRepo.save(ad);
        console.log('✅ Reklam oluşturuldu.');
        console.log('\n==================================================');
        console.log('🎉 PostgreSQL Seed İşlemi Başarıyla Tamamlandı!');
        console.log('==================================================');
        console.log('📌 Admin Kullanıcı:');
        console.log(`   Email: ${userData[0].email}`);
        console.log(`   Şifre: 123456`);
        console.log(`   Role: admin`);
        console.log('\n📌 Moderator Kullanıcı:');
        console.log(`   Email: ${userData[1].email}`);
        console.log(`   Şifre: 123456`);
        console.log(`   Role: moderator`);
        console.log('\nTüm kullanıcıların şifresi: 123456');
        await dataSource.destroy();
        console.log('PostgreSQL bağlantısı kapatıldı.');
    }
    catch (error) {
        console.error('Seed hatası:', error);
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=seed.js.map