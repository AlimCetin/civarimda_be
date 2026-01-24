import 'reflect-metadata';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { User, UserSchema } from './src/entities/user.entity';
import { UserCredentials, UserCredentialsSchema } from './src/entities/user-credentials.entity';
import { Post, PostSchema } from './src/entities/post.entity';
import { Comment, CommentSchema } from './src/entities/comment.entity';
import { Conversation, ConversationSchema } from './src/entities/conversation.entity';
import { Message, MessageSchema } from './src/entities/message.entity';
import { Notification, NotificationSchema } from './src/entities/notification.entity';
import { Report, ReportSchema, ReportType, ReportReason, ReportStatus, ReportPriority } from './src/entities/report.entity';
import { Ad, AdSchema, AdType, AdStatus } from './src/entities/ad.entity';
import { ActivityLog, ActivityLogSchema, ActivityType } from './src/entities/activity-log.entity';
import { Appeal, AppealSchema, AppealStatus } from './src/entities/appeal.entity';
import * as bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tosyam';

// Mongoose modellerini oluştur (eğer zaten tanımlı değilse)
const UserModel = mongoose.models[User.name] || mongoose.model(User.name, UserSchema);
const UserCredentialsModel = mongoose.models[UserCredentials.name] || mongoose.model(UserCredentials.name, UserCredentialsSchema);
const PostModel = mongoose.models[Post.name] || mongoose.model(Post.name, PostSchema);
const CommentModel = mongoose.models[Comment.name] || mongoose.model(Comment.name, CommentSchema);
const ConversationModel = mongoose.models[Conversation.name] || mongoose.model(Conversation.name, ConversationSchema);
const MessageModel = mongoose.models[Message.name] || mongoose.model(Message.name, MessageSchema);
const NotificationModel = mongoose.models[Notification.name] || mongoose.model(Notification.name, NotificationSchema);
const ReportModel = mongoose.models[Report.name] || mongoose.model(Report.name, ReportSchema);
const AdModel = mongoose.models[Ad.name] || mongoose.model(Ad.name, AdSchema);
const ActivityLogModel = mongoose.models[ActivityLog.name] || mongoose.model(ActivityLog.name, ActivityLogSchema);
const AppealModel = mongoose.models[Appeal.name] || mongoose.model(Appeal.name, AppealSchema);

// Yardımcı fonksiyonlar
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
  'Kitap okumak zihni açıyor 📖',
  'Yaratıcı projeler üzerinde çalışmak heyecan verici 💡',
  'Doğa fotoğrafları çekmek tutkum 📷',
  'Yeni bir şeyler öğrenmek her zaman güzel 🎓',
  'Arkadaşlarımla vakit geçirmek harika 👫',
  'Sabah kahvesi ile güne başlamak 🍵',
  'Gün batımı manzarası muhteşemdi 🌅',
  'Yoga yapmak bedeni ve zihni rahatlatıyor 🧘',
  'Fotoğrafçılık benim için bir tutku 📸',
  'Sanat galerisinde harika eserler gördüm 🎭',
  'Konserde muhteşem anlar yaşadım 🎤',
  'Doğa yürüyüşü çok keyifliydi 🥾',
  'Mutfakta yeni tarifler deniyorum 🍳',
  'Sahilde huzur dolu anlar ⛱️',
  'Şehirde keşfedilmemiş yerler 🏙️',
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
  'Tebrikler! 🎉',
  'Çok güzel bir paylaşım',
  'Devamını bekliyorum!',
  'Mükemmel! 🌟',
  'Çok etkileyici',
  'Harika bir iş çıkarmışsın',
  'Bunu sevdim! 👍',
  'Çok güzel olmuş',
  'İyi çalışmalar!',
  'Süper! 👌',
  'Harika! 🔥',
  'Çok güzel bir çalışma',
  'Bana ilham verdi ✨',
  'Muhteşem!',
  'Çok başarılı!',
  'Bunu çok sevdim',
  'Harika bir paylaşım',
  'Bravo! 👏',
  'Çok güzel',
  'Mükemmel bir iş',
];

const messageTexts = [
  'Merhaba, nasılsın?',
  'İyi günler!',
  'Ne yapıyorsun?',
  'Nasıl gidiyor?',
  'Görüşmek ister misin?',
  'Bir şey sorabilir miyim?',
  'Tabii, ne var?',
  'Teşekkürler!',
  'Rica ederim',
  'Tabii ki!',
  'Elbette',
  'Harika!',
  'Çok güzel',
  'Anladım',
  'Tamam',
  'Görüşürüz',
  'İyi geceler',
  'İyi günler',
  'Başarılar',
  'Kolay gelsin',
  'Naber?',
  'Ne haber?',
  'Nasılsın?',
  'İyiyim sen?',
  'İyi gidiyor',
  'Harika bir gün geçirdim',
  'Yarın görüşelim mi?',
  'Tabii, uygun olur',
  'Tamam, görüşürüz',
  'Teşekkür ederim',
];

const bios = [
  'Yazılım geliştirici ve teknoloji tutkunu',
  'Tasarımcı ve sanatsever',
  'Fotoğrafçı ve gezgin',
  'Öğretmen ve kitap sever',
  'Girişimci ve iş insanı',
  'Mühendis ve araştırmacı',
  'Sanatçı ve yaratıcı',
  'Öğrenci ve meraklı',
  'Yazar ve düşünür',
  'Müzisyen ve besteci',
  'Doktor ve sağlık gönüllüsü',
  'Çevreci ve doğa sever',
  'Sporcu ve antrenör',
  'Aşçı ve restoran sahibi',
  'Grafik tasarımcı',
  'Youtuber ve içerik üreticisi',
  'Blog yazarı',
  'Podcast yapımcısı',
  'Girişimci ve mentor',
  'Eğitmen ve koç',
];

async function seed() {
  try {
    console.log('MongoDB\'ye bağlanılıyor...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB\'ye başarıyla bağlanıldı!');

    // Mevcut verileri temizle
    console.log('Mevcut veriler temizleniyor...');
    await AppealModel.deleteMany({});
    await ActivityLogModel.deleteMany({});
    await AdModel.deleteMany({});
    await ReportModel.deleteMany({});
    await UserCredentialsModel.deleteMany({});
    await UserModel.deleteMany({});
    await PostModel.deleteMany({});
    await CommentModel.deleteMany({});
    await ConversationModel.deleteMany({});
    await MessageModel.deleteMany({});
    await NotificationModel.deleteMany({});
    console.log('Veriler temizlendi!');

    // Eski index'leri temizle (username ve email index'leri varsa)
    console.log('Eski index\'ler temizleniyor...');
    try {
      // Model üzerinden collection'a eriş ve username index'ini kaldır
      await UserModel.collection.dropIndex('username_1');
      console.log('username_1 index\'i kaldırıldı!');
    } catch (error: any) {
      // Index yoksa veya başka bir hata varsa log at ama devam et
      if (error.code === 27 || error.codeName === 'IndexNotFound' || error.message?.includes('index not found')) {
        console.log('username_1 index\'i bulunamadı, atlanıyor...');
      } else {
        console.log('Index temizleme hatası (devam ediliyor): ', error.message);
      }
    }
    try {
      // Model üzerinden collection'a eriş ve email index'ini kaldır
      await UserModel.collection.dropIndex('email_1');
      console.log('email_1 index\'i kaldırıldı!');
    } catch (error: any) {
      // Index yoksa veya başka bir hata varsa log at ama devam et
      if (error.code === 27 || error.codeName === 'IndexNotFound' || error.message?.includes('index not found')) {
        console.log('email_1 index\'i bulunamadı, atlanıyor...');
      } else {
        console.log('Index temizleme hatası (devam ediliyor): ', error.message);
      }
    }

    // Kullanıcılar oluştur (50 kullanıcı)
    console.log('Kullanıcılar oluşturuluyor...');
    
    const userData = [
      { fullName: 'Ahmet Yılmaz', email: 'ali@a.com' },
      { fullName: 'Ayşe Demir', email: 'ali1@a.com' },
      { fullName: 'Mehmet Kaya', email: 'mehmet@example.com' },
      { fullName: 'Fatma Özkan', email: 'fatma@example.com' },
      { fullName: 'Ali Şahin', email: 'ali@example.com' },
      { fullName: 'Zeynep Yıldız', email: 'zeynep@example.com' },
      { fullName: 'Mustafa Çelik', email: 'mustafa@example.com' },
      { fullName: 'Elif Arslan', email: 'elif@example.com' },
      { fullName: 'Can Öztürk', email: 'can@example.com' },
      { fullName: 'Dilara Kılıç', email: 'dilara@example.com' },
      { fullName: 'Emre Yılmaz', email: 'emre@example.com' },
      { fullName: 'Seda Aydın', email: 'seda@example.com' },
      { fullName: 'Burak Kara', email: 'burak@example.com' },
      { fullName: 'Melis Şahin', email: 'melis@example.com' },
      { fullName: 'Onur Demir', email: 'onur@example.com' },
      { fullName: 'Eda Yıldırım', email: 'eda@example.com' },
      { fullName: 'Kerem Özkan', email: 'kerem@example.com' },
      { fullName: 'Nazlı Çakır', email: 'nazli@example.com' },
      { fullName: 'Tayfun Kaya', email: 'tayfun@example.com' },
      { fullName: 'Selin Avcı', email: 'selin@example.com' },
      { fullName: 'Berkay Yılmaz', email: 'berkay@example.com' },
      { fullName: 'Damla Çelik', email: 'damla@example.com' },
      { fullName: 'Yasin Öztürk', email: 'yasin@example.com' },
      { fullName: 'Begüm Kılıç', email: 'begum@example.com' },
      { fullName: 'Eren Aydın', email: 'eren@example.com' },
      { fullName: 'Azra Kara', email: 'azra@example.com' },
      { fullName: 'Arda Şahin', email: 'arda@example.com' },
      { fullName: 'Defne Demir', email: 'defne@example.com' },
      { fullName: 'Kutay Yıldırım', email: 'kutay@example.com' },
      { fullName: 'Beste Özkan', email: 'beste@example.com' },
      { fullName: 'Cem Yıldız', email: 'cem@example.com' },
      { fullName: 'Deniz Kaya', email: 'deniz@example.com' },
      { fullName: 'Ece Çelik', email: 'ece@example.com' },
      { fullName: 'Furkan Arslan', email: 'furkan@example.com' },
      { fullName: 'Gizem Öztürk', email: 'gizem@example.com' },
      { fullName: 'Halil Kılıç', email: 'halil@example.com' },
      { fullName: 'İrem Aydın', email: 'irem@example.com' },
      { fullName: 'Jale Kara', email: 'jale@example.com' },
      { fullName: 'Kaan Şahin', email: 'kaan@example.com' },
      { fullName: 'Lara Demir', email: 'lara@example.com' },
      { fullName: 'Mert Yıldırım', email: 'mert@example.com' },
      { fullName: 'Nur Özkan', email: 'nur@example.com' },
      { fullName: 'Ömer Yılmaz', email: 'omer@example.com' },
      { fullName: 'Pınar Kaya', email: 'pinar@example.com' },
      { fullName: 'Rıza Çelik', email: 'riza@example.com' },
      { fullName: 'Sibel Arslan', email: 'sibel@example.com' },
      { fullName: 'Tolga Öztürk', email: 'tolga@example.com' },
      { fullName: 'Umut Kılıç', email: 'umut@example.com' },
      { fullName: 'Volkan Aydın', email: 'volkan@example.com' },
    ];

    const users: (User & Document)[] = [];
    const hashedPassword = await bcrypt.hash('123456', 12);
    const credentialsData: any[] = [];

    // Önce User'ları oluştur
    for (let i = 0; i < userData.length; i++) {
      // İlk kullanıcıyı (Ahmet Yılmaz, ali@a.com) admin yap
      const isAdmin = i === 0;
      const role = isAdmin ? 'admin' : (i === 1 ? 'moderator' : 'user');
      
      const user = await UserModel.create({
        fullName: userData[i].fullName,
        avatar: `https://i.pravatar.cc/150?img=${i + 1}`,
        bio: bios[i % bios.length],
        isVerified: i % 3 === 0,
        role: role,
        warningCount: i > 10 && i % 5 === 0 ? getRandomInt(1, 3) : 0,
        isPermanentlyBanned: false,
        bannedUntil: null,
        followers: [],
        following: [],
        blockedUsers: [],
      });

      users.push(user);

      // Her User için Credentials oluştur (insertMany kullanacağımız için password'ü önceden hash'liyoruz)
      credentialsData.push({
        userId: user._id,
        email: userData[i].email.toLowerCase(),
        password: hashedPassword,
      });
    }

    // UserCredentials'ları oluştur
    await UserCredentialsModel.insertMany(credentialsData);
    console.log(`${users.length} kullanıcı ve credentials oluşturuldu!`);

    // Follow ilişkileri oluştur (her kullanıcı rastgele 8-25 kişiyi takip eder)
    console.log('Follow ilişkileri oluşturuluyor...');
    for (const user of users) {
      const followCount = getRandomInt(8, 25);
      const usersToFollow = getRandomElements(
        users.filter(u => u._id.toString() !== user._id.toString()),
        followCount
      );

      const followingIds = usersToFollow.map(u => u._id.toString());
      await UserModel.updateOne({ _id: user._id }, { $set: { following: followingIds } });

      // Takip edilenlerin follower listesine ekle
      for (const followedUser of usersToFollow) {
        await UserModel.updateOne(
          { _id: followedUser._id },
          { $addToSet: { followers: user._id.toString() } }
        );
      }
    }
    console.log('Follow ilişkileri oluşturuldu!');

    // Post'lar oluştur (200 post)
    console.log('Post\'lar oluşturuluyor...');
    const posts: any[] = [];
    for (let i = 0; i < 200; i++) {
      const randomUser = getRandomElement(users);
      const likeCount = getRandomInt(5, 40);
      const likers = getRandomElements(
        users.filter(u => u._id.toString() !== randomUser._id.toString()),
        likeCount
      );

      posts.push({
        userId: randomUser._id.toString(),
        image: `https://picsum.photos/800/600?random=${i + 1}`,
        caption: getRandomElement(captions),
        likes: likers.map(u => u._id.toString()),
        commentCount: 0,
      });
    }
    const insertedPosts = await PostModel.insertMany(posts);
    console.log(`${insertedPosts.length} post oluşturuldu!`);

    // Comment'ler oluştur (500 yorum)
    console.log('Comment\'ler oluşturuluyor...');
    const comments: any[] = [];
    for (let i = 0; i < 500; i++) {
      const randomPost = getRandomElement(insertedPosts);
      const randomUser = getRandomElement(users);

      comments.push({
        postId: randomPost._id.toString(),
        userId: randomUser._id.toString(),
        text: getRandomElement(commentTexts),
      });
    }

    const insertedComments = await CommentModel.insertMany(comments);

    // Comment sayılarını güncelle
    const postCommentCounts: { [key: string]: number } = {};
    for (const comment of insertedComments) {
      postCommentCounts[comment.postId] = (postCommentCounts[comment.postId] || 0) + 1;
    }

    for (const [postId, count] of Object.entries(postCommentCounts)) {
      await PostModel.updateOne({ _id: postId }, { $set: { commentCount: count } });
    }

    console.log(`${insertedComments.length} yorum oluşturuldu!`);

    // Conversation'lar oluştur (60 conversation)
    console.log('Conversation\'lar oluşturuluyor...');
    const conversations: any[] = [];
    const conversationPairs = new Set<string>();

    while (conversations.length < 60) {
      const user1 = getRandomElement(users);
      const user2 = getRandomElement(users.filter(u => u._id.toString() !== user1._id.toString()));
      
      const pairKey = [user1._id.toString(), user2._id.toString()].sort().join('-');
      if (!conversationPairs.has(pairKey)) {
        conversationPairs.add(pairKey);
        conversations.push({
          participants: [user1._id.toString(), user2._id.toString()],
          lastMessage: null,
          lastMessageAt: new Date(),
        });
      }
    }

    const insertedConversations = await ConversationModel.insertMany(conversations);
    console.log(`${insertedConversations.length} conversation oluşturuldu!`);

    // Message'lar oluştur (400 mesaj) - İlişkili ve gerçekçi
    console.log('Message\'lar oluşturuluyor...');
    const messagesByConv: { [key: string]: any[] } = {};
    const messageNotifications: any[] = []; // Mesaj bildirimleri için

    // Her conversation'a mesajları grupla
    for (const conv of insertedConversations) {
      messagesByConv[conv._id.toString()] = [];
    }

    // Her conversation'a rastgele 3-15 mesaj ekle (zaman sırasına göre)
    for (const conv of insertedConversations) {
      const messageCount = getRandomInt(3, 15);
      const [user1Id, user2Id] = conv.participants;
      const baseTime = new Date();
      baseTime.setDate(baseTime.getDate() - getRandomInt(1, 30)); // Son 30 gün içinde
      
      for (let i = 0; i < messageCount; i++) {
        const senderId = Math.random() > 0.5 ? user1Id : user2Id;
        const receiverId = senderId === user1Id ? user2Id : user1Id;
        
        // Zaman sırasına göre mesaj oluştur (her mesaj bir sonrakinden önce)
        const messageTime = new Date(baseTime);
        messageTime.setMinutes(messageTime.getMinutes() + i * getRandomInt(5, 60));
        
        const messageData = {
          conversationId: conv._id.toString(),
          senderId: senderId,
          text: getRandomElement(messageTexts),
          read: Math.random() > 0.4,
          createdAt: messageTime,
        };
        
        messagesByConv[conv._id.toString()].push(messageData);
        
        // Her mesaj için alıcıya bildirim oluştur (son 10 mesaj için)
        if (i >= messageCount - 10) {
          messageNotifications.push({
            userId: receiverId,
            fromUserId: senderId,
            type: 'message',
            read: Math.random() > 0.6, // Son mesajlar daha az okunmuş
            createdAt: messageTime,
          });
        }
      }
    }

    const allMessages: any[] = [];
    for (const convMessages of Object.values(messagesByConv)) {
      allMessages.push(...convMessages);
    }

    const insertedMessages = await MessageModel.insertMany(allMessages);

    // Conversation'ların lastMessage'larını güncelle
    for (const conv of insertedConversations) {
      const convMessages = insertedMessages.filter(m => m.conversationId === conv._id.toString());
      if (convMessages.length > 0) {
        // En son mesajı bul (createdAt'e göre)
        const lastMessage = convMessages.reduce((latest, current) => {
          const latestTime = new Date(latest.createdAt || 0).getTime();
          const currentTime = new Date(current.createdAt || 0).getTime();
          return currentTime > latestTime ? current : latest;
        });

        await ConversationModel.updateOne(
          { _id: conv._id },
          {
            $set: {
              lastMessage: lastMessage._id.toString(),
              lastMessageAt: lastMessage.createdAt || new Date(),
            },
          }
        );
      }
    }

    console.log(`${insertedMessages.length} mesaj oluşturuldu!`);

    // Ali'ye özel mesajlar ekle (5-6 kişi Ali'ye mesaj atsın)
    console.log('Ali\'ye özel mesajlar ekleniyor...');
    const aliUser = users[0]; // Ali ilk kullanıcı (ali@a.com)
    const sendersToAli = getRandomElements(
      users.filter(u => u._id.toString() !== aliUser._id.toString()),
      6 // 6 kişi Ali'ye mesaj atsın
    );

    const aliMessages: any[] = [];
    const aliConversations: any[] = [];
    const aliNotifications: any[] = [];

    for (const sender of sendersToAli) {
      // Ali ile sender arasında conversation oluştur
      const aliConv = await ConversationModel.create({
        participants: [aliUser._id.toString(), sender._id.toString()],
        lastMessage: null,
        lastMessageAt: new Date(),
      });
      aliConversations.push(aliConv);

      // Sender'dan Ali'ye 3-8 mesaj gönder
      const messageCount = getRandomInt(3, 8);
      const baseTime = new Date();
      baseTime.setDate(baseTime.getDate() - getRandomInt(1, 7)); // Son 7 gün içinde

      for (let i = 0; i < messageCount; i++) {
        const messageTime = new Date(baseTime);
        messageTime.setMinutes(messageTime.getMinutes() + i * getRandomInt(10, 120));
        
        const messageText = getRandomElement(messageTexts);
        const aliMessageData = {
          conversationId: aliConv._id.toString(),
          senderId: sender._id.toString(), // Sender'dan Ali'ye
          text: messageText,
          read: i < messageCount - 2, // Son 2 mesaj okunmamış
          createdAt: messageTime,
        };

        aliMessages.push(aliMessageData);

        // Ali'ye bildirim oluştur
        aliNotifications.push({
          userId: aliUser._id.toString(),
          fromUserId: sender._id.toString(),
          type: 'message',
          read: i >= messageCount - 2, // Son 2 mesaj okunmamış
          createdAt: messageTime,
        });
      }
    }

    // Ali'nin mesajlarını ekle
    if (aliMessages.length > 0) {
      const insertedAliMessages = await MessageModel.insertMany(aliMessages);
      
      // Ali'nin conversation'larının lastMessage'larını güncelle
      for (const aliConv of aliConversations) {
        const convMessages = insertedAliMessages.filter(m => m.conversationId === aliConv._id.toString());
        if (convMessages.length > 0) {
          const lastMessage = convMessages.reduce((latest, current) => {
            const latestTime = new Date(latest.createdAt || 0).getTime();
            const currentTime = new Date(current.createdAt || 0).getTime();
            return currentTime > latestTime ? current : latest;
          });

          await ConversationModel.updateOne(
            { _id: aliConv._id },
            {
              $set: {
                lastMessage: lastMessage._id.toString(),
                lastMessageAt: lastMessage.createdAt || new Date(),
              },
            }
          );
        }
      }

      console.log(`✅ Ali'ye ${aliMessages.length} mesaj eklendi (${sendersToAli.length} farklı kişiden)`);
      
      // Ali'nin bildirimlerini ekle
      if (aliNotifications.length > 0) {
        await NotificationModel.insertMany(aliNotifications);
        console.log(`✅ Ali için ${aliNotifications.length} mesaj bildirimi eklendi`);
      }
    }

    // Notification'lar oluştur - GERÇEK İLİŞKİLERLE
    console.log('Notification\'lar oluşturuluyor...');
    const notifications: any[] = [];

    // 1. LIKE bildirimleri - Gerçek like'lardan oluştur
    console.log('  - Like bildirimleri oluşturuluyor...');
    for (const post of insertedPosts) {
      const postOwnerId = post.userId.toString();
      const likers = post.likes || [];
      
      // Her like için post sahibine bildirim oluştur (kendisi beğenmediyse)
      for (const likerId of likers) {
        if (likerId !== postOwnerId) {
          notifications.push({
            userId: postOwnerId,
            fromUserId: likerId,
            type: 'like',
            postId: post._id.toString(),
            read: Math.random() > 0.5,
            createdAt: new Date(Date.now() - getRandomInt(0, 30) * 24 * 60 * 60 * 1000), // Son 30 gün
          });
        }
      }
    }
    console.log(`  ✅ ${notifications.length} like bildirimi oluşturuldu`);

    // 2. COMMENT bildirimleri - Gerçek comment'lerden oluştur
    console.log('  - Comment bildirimleri oluşturuluyor...');
    let commentNotificationCount = 0;
    for (const comment of insertedComments) {
      const commenterId = comment.userId.toString();
      const post = insertedPosts.find(p => p._id.toString() === comment.postId);
      
      if (post) {
        const postOwnerId = post.userId.toString();
        
        // Comment yapan kişi post sahibi değilse bildirim oluştur
        if (commenterId !== postOwnerId) {
          notifications.push({
            userId: postOwnerId,
            fromUserId: commenterId,
            type: 'comment',
            postId: post._id.toString(),
            read: Math.random() > 0.5,
            createdAt: comment.createdAt || new Date(),
          });
          commentNotificationCount++;
        }
      }
    }
    console.log(`  ✅ ${commentNotificationCount} comment bildirimi oluşturuldu`);

    // 3. FOLLOW bildirimleri - Gerçek follow ilişkilerinden oluştur
    console.log('  - Follow bildirimleri oluşturuluyor...');
    let followNotificationCount = 0;
    for (const user of users) {
      const followers = user.followers || [];
      
      // Her follower için bildirim oluştur (son 50 takipçi için)
      const recentFollowers = followers.slice(-50);
      for (const followerId of recentFollowers) {
        notifications.push({
          userId: user._id.toString(),
          fromUserId: followerId,
          type: 'follow',
          read: Math.random() > 0.6, // Follow bildirimleri daha az okunmuş
          createdAt: new Date(Date.now() - getRandomInt(0, 60) * 24 * 60 * 60 * 1000), // Son 60 gün
        });
        followNotificationCount++;
      }
    }
    console.log(`  ✅ ${followNotificationCount} follow bildirimi oluşturuldu`);

    // 4. MESSAGE bildirimleri - Gerçek mesajlardan oluştur (zaten oluşturuldu)
    console.log('  - Message bildirimleri oluşturuluyor...');
    notifications.push(...messageNotifications);
    console.log(`  ✅ ${messageNotifications.length} message bildirimi oluşturuldu`);

    // Tüm bildirimleri ekle
    await NotificationModel.insertMany(notifications);
    console.log(`\n✅ Toplam ${notifications.length} notification oluşturuldu!`);

    // Report'lar oluştur (ilişkili verilerle)
    console.log('\nReport\'lar oluşturuluyor...');
    const adminUser = users[0]; // Admin kullanıcı
    const moderatorUser = users[1]; // Moderator kullanıcı
    const reports: any[] = [];
    
    // Post report'ları (30 adet)
    for (let i = 0; i < 30; i++) {
      const randomPost = getRandomElement(insertedPosts);
      const reporter = getRandomElement(users.filter(u => u._id.toString() !== randomPost.userId.toString()));
      const reportCount = getRandomInt(1, 8);
      
      let priority = ReportPriority.MEDIUM;
      if (reportCount >= 5) priority = ReportPriority.HIGH;
      if (reportCount >= 8) priority = ReportPriority.URGENT;
      
      const statuses = [ReportStatus.PENDING, ReportStatus.IN_REVIEW, ReportStatus.RESOLVED, ReportStatus.REJECTED];
      const status = i < 10 ? ReportStatus.PENDING : (i < 20 ? ReportStatus.IN_REVIEW : getRandomElement(statuses));
      
      reports.push({
        reporterId: reporter._id.toString(),
        reportedId: randomPost._id.toString(),
        type: ReportType.POST,
        reason: getRandomElement([
          ReportReason.SPAM,
          ReportReason.INAPPROPRIATE_CONTENT,
          ReportReason.COPYRIGHT,
          ReportReason.FAKE_NEWS,
          ReportReason.OTHER,
        ]),
        description: `Bu gönderi hakkında şikayet: ${getRandomElement(['Uygunsuz içerik', 'Spam', 'Telif hakkı ihlali', 'Yanıltıcı bilgi', 'Diğer'])}`,
        status: status,
        priority: priority,
        reportCount: reportCount,
        reviewedBy: status !== ReportStatus.PENDING ? (status === ReportStatus.RESOLVED ? adminUser._id.toString() : moderatorUser._id.toString()) : null,
        reviewedAt: status !== ReportStatus.PENDING ? new Date(Date.now() - getRandomInt(1, 30) * 24 * 60 * 60 * 1000) : null,
        adminNote: status === ReportStatus.RESOLVED ? 'Şikayet incelendi ve gerekli işlem yapıldı.' : (status === ReportStatus.REJECTED ? 'Şikayet geçersiz bulundu.' : ''),
        createdAt: new Date(Date.now() - getRandomInt(1, 60) * 24 * 60 * 60 * 1000),
      });
    }
    
    // User report'ları (20 adet)
    for (let i = 0; i < 20; i++) {
      const reportedUser = getRandomElement(users.slice(2)); // İlk 2 kullanıcıyı (admin/moderator) hariç tut
      const reporter = getRandomElement(users.filter(u => u._id.toString() !== reportedUser._id.toString()));
      
      reports.push({
        reporterId: reporter._id.toString(),
        reportedId: reportedUser._id.toString(),
        type: ReportType.USER,
        reason: getRandomElement([
          ReportReason.HARASSMENT,
          ReportReason.SPAM,
          ReportReason.INAPPROPRIATE_CONTENT,
          ReportReason.FAKE_NEWS,
          ReportReason.HATE_SPEECH,
        ]),
        description: `Bu kullanıcı hakkında şikayet: ${getRandomElement(['Taciz', 'Spam hesap', 'Sahte profil', 'Nefret söylemi', 'Uygunsuz davranış'])}`,
        status: i < 8 ? ReportStatus.PENDING : ReportStatus.IN_REVIEW,
        priority: i % 3 === 0 ? ReportPriority.HIGH : ReportPriority.MEDIUM,
        reportCount: getRandomInt(1, 5),
        reviewedBy: null,
        reviewedAt: null,
        adminNote: '',
        createdAt: new Date(Date.now() - getRandomInt(1, 45) * 24 * 60 * 60 * 1000),
      });
    }
    
    const insertedReports = await ReportModel.insertMany(reports);
    console.log(`✅ ${insertedReports.length} report oluşturuldu!`);

    // Ads oluştur (10 reklam)
    console.log('\nReklamlar oluşturuluyor...');
    const ads: any[] = [];
    const adTitles = [
      'Özel İndirim Fırsatları',
      'Yeni Koleksiyon',
      'Ücretsiz Kargo',
      'Son Günlerde Fırsat',
      'Premium Üyelik',
      'Özel Kampanya',
      'Yeni Ürünler',
      'Mega İndirim',
      'Sınırlı Süre',
      'Özel Teklif',
    ];
    
    for (let i = 0; i < 10; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - getRandomInt(0, 10));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + getRandomInt(30, 90));
      
      const isActive = i < 5; // İlk 5'i aktif
      const adType = i % 2 === 0 ? AdType.IMAGE : AdType.VIDEO;
      
      ads.push({
        title: adTitles[i],
        type: adType,
        mediaUrl: adType === AdType.IMAGE 
          ? `https://picsum.photos/800/600?random=${i + 1000}`
          : `https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4`,
        linkUrl: `https://example.com/campaign/${i + 1}`,
        description: `Özel kampanya fırsatları! ${i + 1}. kampanya detayları için tıklayın.`,
        status: isActive ? AdStatus.ACTIVE : (i < 7 ? AdStatus.PAUSED : AdStatus.DRAFT),
        startDate: startDate,
        endDate: endDate,
        clickCount: getRandomInt(0, 500),
        viewCount: getRandomInt(100, 5000),
        impressionCount: getRandomInt(500, 10000),
        createdBy: adminUser._id.toString(),
        maxImpressions: i % 3 === 0 ? getRandomInt(5000, 20000) : 0,
        budget: getRandomInt(1000, 10000),
        spentAmount: getRandomInt(100, 5000),
        createdAt: new Date(Date.now() - getRandomInt(1, 30) * 24 * 60 * 60 * 1000),
      });
    }
    
    const insertedAds = await AdModel.insertMany(ads);
    console.log(`✅ ${insertedAds.length} reklam oluşturuldu!`);

    // ActivityLog'lar oluştur (admin işlemleri)
    console.log('\nActivity Log\'lar oluşturuluyor...');
    const activityLogs: any[] = [];
    
    // Ban işlemleri (10 adet)
    const bannedUsers = users.slice(5, 15); // 5-15 arası kullanıcılar banlı olsun
    for (let i = 0; i < 10; i++) {
      const targetUser = bannedUsers[i];
      const isPermanent = i % 3 === 0;
      
      activityLogs.push({
        adminId: adminUser._id.toString(),
        activityType: ActivityType.USER_BANNED,
        targetUserId: targetUser._id.toString(),
        description: `Kullanıcı ${isPermanent ? 'kalıcı olarak' : 'geçici olarak'} banlandı`,
        metadata: {
          isPermanent: isPermanent,
          bannedUntil: isPermanent ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          reason: 'Kurallara aykırı davranış',
        },
        createdAt: new Date(Date.now() - getRandomInt(1, 30) * 24 * 60 * 60 * 1000),
      });
      
      // Ban işlemini kullanıcıya da uygula
      await UserModel.updateOne(
        { _id: targetUser._id },
        {
          $set: {
            isPermanentlyBanned: isPermanent,
            bannedUntil: isPermanent ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        }
      );
    }
    
    // Warning işlemleri (15 adet)
    const warnedUsers = users.slice(15, 30);
    for (let i = 0; i < 15; i++) {
      const targetUser = warnedUsers[i];
      const warningCount = getRandomInt(1, 3);
      
      activityLogs.push({
        adminId: i % 2 === 0 ? adminUser._id.toString() : moderatorUser._id.toString(),
        activityType: ActivityType.USER_WARNED,
        targetUserId: targetUser._id.toString(),
        description: `Kullanıcıya uyarı verildi (Toplam uyarı: ${warningCount})`,
        metadata: {
          warningCount: warningCount,
          reason: 'Kurallara uygun olmayan içerik',
        },
        createdAt: new Date(Date.now() - getRandomInt(1, 45) * 24 * 60 * 60 * 1000),
      });
      
      // Warning'i kullanıcıya da uygula
      await UserModel.updateOne(
        { _id: targetUser._id },
        { $set: { warningCount: warningCount } }
      );
    }
    
    // Post silme işlemleri (5 adet)
    const deletedPosts = insertedPosts.slice(10, 15);
    for (let i = 0; i < 5; i++) {
      const targetPost = deletedPosts[i];
      
      activityLogs.push({
        adminId: moderatorUser._id.toString(),
        activityType: ActivityType.POST_DELETED,
        targetPostId: targetPost._id.toString(),
        targetUserId: targetPost.userId.toString(),
        description: 'Gönderi admin tarafından silindi',
        metadata: {
          reason: 'Uygunsuz içerik',
        },
        createdAt: new Date(Date.now() - getRandomInt(1, 20) * 24 * 60 * 60 * 1000),
      });
      
      // Post'u soft delete yap
      await PostModel.updateOne(
        { _id: targetPost._id },
        { $set: { deletedAt: new Date() } }
      );
    }
    
    // Report çözme işlemleri
    const resolvedReports = insertedReports.slice(20, 35);
    for (let i = 0; i < 15; i++) {
      const report = resolvedReports[i];
      if (report.status === ReportStatus.RESOLVED) {
        activityLogs.push({
          adminId: report.reviewedBy || adminUser._id.toString(),
          activityType: ActivityType.REPORT_RESOLVED,
          targetReportId: report._id.toString(),
          description: 'Şikayet çözüldü',
          metadata: {
            reportType: report.type,
            reason: report.reason,
          },
          createdAt: report.reviewedAt || new Date(),
        });
      }
    }
    
    // Ad oluşturma işlemleri
    for (let i = 0; i < 10; i++) {
      const ad = insertedAds[i];
      activityLogs.push({
        adminId: adminUser._id.toString(),
        activityType: ActivityType.AD_CREATED,
        targetAdId: ad._id.toString(),
        description: `Reklam oluşturuldu: ${ad.title}`,
        metadata: {
          adId: ad._id.toString(),
          adType: ad.type,
        },
        createdAt: ad.createdAt,
      });
    }
    
    const insertedActivityLogs = await ActivityLogModel.insertMany(activityLogs);
    console.log(`✅ ${insertedActivityLogs.length} activity log oluşturuldu!`);

    // Appeal'lar oluştur (ban itirazları - 5 adet)
    console.log('\nAppeal\'lar oluşturuluyor...');
    const appeals: any[] = [];
    const appealUsers = bannedUsers.slice(0, 5);
    
    // Ban activity log'larını ID'leri ile eşleştir
    const banLogsMap = new Map();
    for (const log of insertedActivityLogs) {
      if (log.activityType === ActivityType.USER_BANNED) {
        banLogsMap.set(log.targetUserId.toString(), log._id.toString());
      }
    }
    
    for (let i = 0; i < 5; i++) {
      const appealUser = appealUsers[i];
      const banLogId = banLogsMap.get(appealUser._id.toString());
      
      if (banLogId) {
        const appealStatus = i < 2 ? AppealStatus.PENDING : (i === 2 ? AppealStatus.APPROVED : AppealStatus.REJECTED);
        
        appeals.push({
          userId: appealUser._id.toString(),
          banLogId: banLogId,
          reason: `Yanlış anlaşıldığımı düşünüyorum. ${i + 1}. itiraz nedeni detayları...`,
          status: appealStatus,
          reviewedBy: appealStatus !== AppealStatus.PENDING ? adminUser._id.toString() : null,
          reviewedAt: appealStatus !== AppealStatus.PENDING ? new Date(Date.now() - getRandomInt(1, 10) * 24 * 60 * 60 * 1000) : null,
          adminResponse: appealStatus === AppealStatus.APPROVED 
            ? 'İtirazınız kabul edildi. Ban kaldırıldı.'
            : appealStatus === AppealStatus.REJECTED
            ? 'İtirazınız reddedildi. Ban devam edecek.'
            : '',
          conversation: [],
          createdAt: new Date(Date.now() - getRandomInt(5, 20) * 24 * 60 * 60 * 1000),
        });
      }
    }
    
    const insertedAppeals = await AppealModel.insertMany(appeals);
    console.log(`✅ ${insertedAppeals.length} appeal oluşturuldu!`);

    console.log('\n✅ Seed işlemi başarıyla tamamlandı!');
    console.log('\nOluşturulan veriler:');
    console.log(`- ${users.length} kullanıcı (1 admin, 1 moderator, ${users.length - 2} user)`);
    console.log(`- ${insertedPosts.length} post`);
    console.log(`- ${insertedComments.length} yorum`);
    console.log(`- ${insertedConversations.length} conversation`);
    console.log(`- ${insertedMessages.length} mesaj`);
    console.log(`- ${notifications.length} notification`);
    console.log(`- ${insertedReports.length} report`);
    console.log(`- ${insertedAds.length} reklam`);
    console.log(`- ${insertedActivityLogs.length} activity log`);
    console.log(`- ${insertedAppeals.length} appeal`);
    console.log('\n📌 Admin Kullanıcı:');
    // Kritik kullanıcıların rollerini garantile (eğer bir şekilde yanlış ayarlandıysa)
    console.log('\n🔧 Kritik kullanıcı rollerini kontrol ediliyor...');
    const adminCredCheck = await UserCredentialsModel.findOne({ email: userData[0].email.toLowerCase() });
    if (adminCredCheck) {
      const adminUserCheck = await UserModel.findById((adminCredCheck as any).userId);
      if (adminUserCheck && adminUserCheck.role !== 'admin') {
        await UserModel.findByIdAndUpdate((adminCredCheck as any).userId, { role: 'admin' });
        console.log(`✅ ${userData[0].email} kullanıcısı admin rolüne ayarlandı.`);
      }
    }

    const moderatorCredCheck = await UserCredentialsModel.findOne({ email: userData[1].email.toLowerCase() });
    if (moderatorCredCheck) {
      const moderatorUserCheck = await UserModel.findById((moderatorCredCheck as any).userId);
      if (moderatorUserCheck && moderatorUserCheck.role !== 'moderator') {
        await UserModel.findByIdAndUpdate((moderatorCredCheck as any).userId, { role: 'moderator' });
        console.log(`✅ ${userData[1].email} kullanıcısı moderator rolüne ayarlandı.`);
      }
    }

    // Kritik kullanıcıların rollerini garantile (eğer bir şekilde yanlış ayarlandıysa)
    console.log('\n🔧 Kritik kullanıcı rollerini kontrol ediliyor...');
    const adminCred = await UserCredentialsModel.findOne({ email: userData[0].email.toLowerCase() });
    if (adminCred) {
      const adminUserDoc = await UserModel.findById((adminCred as any).userId);
      if (adminUserDoc && adminUserDoc.role !== 'admin') {
        await UserModel.findByIdAndUpdate((adminCred as any).userId, { role: 'admin' });
        console.log(`✅ ${userData[0].email} kullanıcısı admin rolüne ayarlandı.`);
      }
    }

    const moderatorCred = await UserCredentialsModel.findOne({ email: userData[1].email.toLowerCase() });
    if (moderatorCred) {
      const moderatorUserDoc = await UserModel.findById((moderatorCred as any).userId);
      if (moderatorUserDoc && moderatorUserDoc.role !== 'moderator') {
        await UserModel.findByIdAndUpdate((moderatorCred as any).userId, { role: 'moderator' });
        console.log(`✅ ${userData[1].email} kullanıcısı moderator rolüne ayarlandı.`);
      }
    }

    console.log(`   Email: ${userData[0].email}`);
    console.log(`   Şifre: 123456`);
    console.log(`   Role: admin`);
    console.log('\n📌 Moderator Kullanıcı:');
    console.log(`   Email: ${userData[1].email}`);
    console.log(`   Şifre: 123456`);
    console.log(`   Role: moderator`);
    console.log('\nTüm kullanıcıların şifresi: 123456');

    await mongoose.disconnect();
    console.log('\nMongoDB bağlantısı kapatıldı.');
  } catch (error) {
    console.error('Seed işlemi sırasında hata oluştu:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
