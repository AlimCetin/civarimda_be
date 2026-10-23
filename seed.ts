import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { User } from './src/entities/user.entity';
import { UserCredentials } from './src/entities/user-credentials.entity';
import { Post } from './src/entities/post.entity';
import { Comment } from './src/entities/comment.entity';
import { Conversation } from './src/entities/conversation.entity';
import { Message } from './src/entities/message.entity';
import { Notification } from './src/entities/notification.entity';
import { Report, ReportType, ReportReason, ReportStatus, ReportPriority } from './src/entities/report.entity';
import { Ad, AdType, AdStatus } from './src/entities/ad.entity';
import { ActivityLog, ActivityType } from './src/entities/activity-log.entity';
import { Appeal, AppealStatus } from './src/entities/appeal.entity';
import * as bcrypt from 'bcryptjs';

const dataSource = new DataSource(
  process.env.DATABASE_URL
    ? {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [
          User,
          UserCredentials,
          Post,
          Comment,
          Conversation,
          Message,
          Notification,
          Report,
          Appeal,
          ActivityLog,
          Ad,
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
          User,
          UserCredentials,
          Post,
          Comment,
          Conversation,
          Message,
          Notification,
          Report,
          Appeal,
          ActivityLog,
          Ad,
        ],
        synchronize: true,
      },
);

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

function getRandomInt(min: number, max: number): number {
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

    const userRepo = dataSource.getRepository(User);
    const credsRepo = dataSource.getRepository(UserCredentials);
    const postRepo = dataSource.getRepository(Post);
    const commentRepo = dataSource.getRepository(Comment);
    const convRepo = dataSource.getRepository(Conversation);
    const msgRepo = dataSource.getRepository(Message);
    const notifRepo = dataSource.getRepository(Notification);
    const reportRepo = dataSource.getRepository(Report);
    const adRepo = dataSource.getRepository(Ad);
    const actRepo = dataSource.getRepository(ActivityLog);
    const appealRepo = dataSource.getRepository(Appeal);

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

    const users: User[] = [];
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

    // Follower / Following ilişkileri
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

    // Postlar oluştur
    console.log('Postlar oluşturuluyor...');
    const posts: Post[] = [];
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

    // Yorumlar oluştur
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

    // Reklamlar oluştur
    console.log('Reklamlar oluşturuluyor...');
    const ad = adRepo.create({
      title: 'Civarımda Yöresel Ürünler & Fırsatlar',
      type: AdType.IMAGE,
      mediaUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c',
      linkUrl: 'https://civarimda.com',
      description: 'Civarımda lezzetleri bir tık uzağınızda!',
      status: AdStatus.ACTIVE,
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
  } catch (error) {
    console.error('Seed hatası:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

seed();
