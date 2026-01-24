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
const mongoose = __importStar(require("mongoose"));
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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tosyam';
const UserModel = mongoose.models[user_entity_1.User.name] || mongoose.model(user_entity_1.User.name, user_entity_1.UserSchema);
const UserCredentialsModel = mongoose.models[user_credentials_entity_1.UserCredentials.name] || mongoose.model(user_credentials_entity_1.UserCredentials.name, user_credentials_entity_1.UserCredentialsSchema);
const PostModel = mongoose.models[post_entity_1.Post.name] || mongoose.model(post_entity_1.Post.name, post_entity_1.PostSchema);
const CommentModel = mongoose.models[comment_entity_1.Comment.name] || mongoose.model(comment_entity_1.Comment.name, comment_entity_1.CommentSchema);
const ConversationModel = mongoose.models[conversation_entity_1.Conversation.name] || mongoose.model(conversation_entity_1.Conversation.name, conversation_entity_1.ConversationSchema);
const MessageModel = mongoose.models[message_entity_1.Message.name] || mongoose.model(message_entity_1.Message.name, message_entity_1.MessageSchema);
const NotificationModel = mongoose.models[notification_entity_1.Notification.name] || mongoose.model(notification_entity_1.Notification.name, notification_entity_1.NotificationSchema);
const ReportModel = mongoose.models[report_entity_1.Report.name] || mongoose.model(report_entity_1.Report.name, report_entity_1.ReportSchema);
const AdModel = mongoose.models[ad_entity_1.Ad.name] || mongoose.model(ad_entity_1.Ad.name, ad_entity_1.AdSchema);
const ActivityLogModel = mongoose.models[activity_log_entity_1.ActivityLog.name] || mongoose.model(activity_log_entity_1.ActivityLog.name, activity_log_entity_1.ActivityLogSchema);
const AppealModel = mongoose.models[appeal_entity_1.Appeal.name] || mongoose.model(appeal_entity_1.Appeal.name, appeal_entity_1.AppealSchema);
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
        console.log('Eski index\'ler temizleniyor...');
        try {
            await UserModel.collection.dropIndex('username_1');
            console.log('username_1 index\'i kaldırıldı!');
        }
        catch (error) {
            if (error.code === 27 || error.codeName === 'IndexNotFound' || error.message?.includes('index not found')) {
                console.log('username_1 index\'i bulunamadı, atlanıyor...');
            }
            else {
                console.log('Index temizleme hatası (devam ediliyor): ', error.message);
            }
        }
        try {
            await UserModel.collection.dropIndex('email_1');
            console.log('email_1 index\'i kaldırıldı!');
        }
        catch (error) {
            if (error.code === 27 || error.codeName === 'IndexNotFound' || error.message?.includes('index not found')) {
                console.log('email_1 index\'i bulunamadı, atlanıyor...');
            }
            else {
                console.log('Index temizleme hatası (devam ediliyor): ', error.message);
            }
        }
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
        const users = [];
        const hashedPassword = await bcrypt.hash('123456', 12);
        const credentialsData = [];
        for (let i = 0; i < userData.length; i++) {
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
            credentialsData.push({
                userId: user._id,
                email: userData[i].email.toLowerCase(),
                password: hashedPassword,
            });
        }
        await UserCredentialsModel.insertMany(credentialsData);
        console.log(`${users.length} kullanıcı ve credentials oluşturuldu!`);
        console.log('Follow ilişkileri oluşturuluyor...');
        for (const user of users) {
            const followCount = getRandomInt(8, 25);
            const usersToFollow = getRandomElements(users.filter(u => u._id.toString() !== user._id.toString()), followCount);
            const followingIds = usersToFollow.map(u => u._id.toString());
            await UserModel.updateOne({ _id: user._id }, { $set: { following: followingIds } });
            for (const followedUser of usersToFollow) {
                await UserModel.updateOne({ _id: followedUser._id }, { $addToSet: { followers: user._id.toString() } });
            }
        }
        console.log('Follow ilişkileri oluşturuldu!');
        console.log('Post\'lar oluşturuluyor...');
        const posts = [];
        for (let i = 0; i < 200; i++) {
            const randomUser = getRandomElement(users);
            const likeCount = getRandomInt(5, 40);
            const likers = getRandomElements(users.filter(u => u._id.toString() !== randomUser._id.toString()), likeCount);
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
        console.log('Comment\'ler oluşturuluyor...');
        const comments = [];
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
        const postCommentCounts = {};
        for (const comment of insertedComments) {
            postCommentCounts[comment.postId] = (postCommentCounts[comment.postId] || 0) + 1;
        }
        for (const [postId, count] of Object.entries(postCommentCounts)) {
            await PostModel.updateOne({ _id: postId }, { $set: { commentCount: count } });
        }
        console.log(`${insertedComments.length} yorum oluşturuldu!`);
        console.log('Conversation\'lar oluşturuluyor...');
        const conversations = [];
        const conversationPairs = new Set();
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
        console.log('Message\'lar oluşturuluyor...');
        const messagesByConv = {};
        const messageNotifications = [];
        for (const conv of insertedConversations) {
            messagesByConv[conv._id.toString()] = [];
        }
        for (const conv of insertedConversations) {
            const messageCount = getRandomInt(3, 15);
            const [user1Id, user2Id] = conv.participants;
            const baseTime = new Date();
            baseTime.setDate(baseTime.getDate() - getRandomInt(1, 30));
            for (let i = 0; i < messageCount; i++) {
                const senderId = Math.random() > 0.5 ? user1Id : user2Id;
                const receiverId = senderId === user1Id ? user2Id : user1Id;
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
                if (i >= messageCount - 10) {
                    messageNotifications.push({
                        userId: receiverId,
                        fromUserId: senderId,
                        type: 'message',
                        read: Math.random() > 0.6,
                        createdAt: messageTime,
                    });
                }
            }
        }
        const allMessages = [];
        for (const convMessages of Object.values(messagesByConv)) {
            allMessages.push(...convMessages);
        }
        const insertedMessages = await MessageModel.insertMany(allMessages);
        for (const conv of insertedConversations) {
            const convMessages = insertedMessages.filter(m => m.conversationId === conv._id.toString());
            if (convMessages.length > 0) {
                const lastMessage = convMessages.reduce((latest, current) => {
                    const latestTime = new Date(latest.createdAt || 0).getTime();
                    const currentTime = new Date(current.createdAt || 0).getTime();
                    return currentTime > latestTime ? current : latest;
                });
                await ConversationModel.updateOne({ _id: conv._id }, {
                    $set: {
                        lastMessage: lastMessage._id.toString(),
                        lastMessageAt: lastMessage.createdAt || new Date(),
                    },
                });
            }
        }
        console.log(`${insertedMessages.length} mesaj oluşturuldu!`);
        console.log('Ali\'ye özel mesajlar ekleniyor...');
        const aliUser = users[0];
        const sendersToAli = getRandomElements(users.filter(u => u._id.toString() !== aliUser._id.toString()), 6);
        const aliMessages = [];
        const aliConversations = [];
        const aliNotifications = [];
        for (const sender of sendersToAli) {
            const aliConv = await ConversationModel.create({
                participants: [aliUser._id.toString(), sender._id.toString()],
                lastMessage: null,
                lastMessageAt: new Date(),
            });
            aliConversations.push(aliConv);
            const messageCount = getRandomInt(3, 8);
            const baseTime = new Date();
            baseTime.setDate(baseTime.getDate() - getRandomInt(1, 7));
            for (let i = 0; i < messageCount; i++) {
                const messageTime = new Date(baseTime);
                messageTime.setMinutes(messageTime.getMinutes() + i * getRandomInt(10, 120));
                const messageText = getRandomElement(messageTexts);
                const aliMessageData = {
                    conversationId: aliConv._id.toString(),
                    senderId: sender._id.toString(),
                    text: messageText,
                    read: i < messageCount - 2,
                    createdAt: messageTime,
                };
                aliMessages.push(aliMessageData);
                aliNotifications.push({
                    userId: aliUser._id.toString(),
                    fromUserId: sender._id.toString(),
                    type: 'message',
                    read: i >= messageCount - 2,
                    createdAt: messageTime,
                });
            }
        }
        if (aliMessages.length > 0) {
            const insertedAliMessages = await MessageModel.insertMany(aliMessages);
            for (const aliConv of aliConversations) {
                const convMessages = insertedAliMessages.filter(m => m.conversationId === aliConv._id.toString());
                if (convMessages.length > 0) {
                    const lastMessage = convMessages.reduce((latest, current) => {
                        const latestTime = new Date(latest.createdAt || 0).getTime();
                        const currentTime = new Date(current.createdAt || 0).getTime();
                        return currentTime > latestTime ? current : latest;
                    });
                    await ConversationModel.updateOne({ _id: aliConv._id }, {
                        $set: {
                            lastMessage: lastMessage._id.toString(),
                            lastMessageAt: lastMessage.createdAt || new Date(),
                        },
                    });
                }
            }
            console.log(`✅ Ali'ye ${aliMessages.length} mesaj eklendi (${sendersToAli.length} farklı kişiden)`);
            if (aliNotifications.length > 0) {
                await NotificationModel.insertMany(aliNotifications);
                console.log(`✅ Ali için ${aliNotifications.length} mesaj bildirimi eklendi`);
            }
        }
        console.log('Notification\'lar oluşturuluyor...');
        const notifications = [];
        console.log('  - Like bildirimleri oluşturuluyor...');
        for (const post of insertedPosts) {
            const postOwnerId = post.userId.toString();
            const likers = post.likes || [];
            for (const likerId of likers) {
                if (likerId !== postOwnerId) {
                    notifications.push({
                        userId: postOwnerId,
                        fromUserId: likerId,
                        type: 'like',
                        postId: post._id.toString(),
                        read: Math.random() > 0.5,
                        createdAt: new Date(Date.now() - getRandomInt(0, 30) * 24 * 60 * 60 * 1000),
                    });
                }
            }
        }
        console.log(`  ✅ ${notifications.length} like bildirimi oluşturuldu`);
        console.log('  - Comment bildirimleri oluşturuluyor...');
        let commentNotificationCount = 0;
        for (const comment of insertedComments) {
            const commenterId = comment.userId.toString();
            const post = insertedPosts.find(p => p._id.toString() === comment.postId);
            if (post) {
                const postOwnerId = post.userId.toString();
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
        console.log('  - Follow bildirimleri oluşturuluyor...');
        let followNotificationCount = 0;
        for (const user of users) {
            const followers = user.followers || [];
            const recentFollowers = followers.slice(-50);
            for (const followerId of recentFollowers) {
                notifications.push({
                    userId: user._id.toString(),
                    fromUserId: followerId,
                    type: 'follow',
                    read: Math.random() > 0.6,
                    createdAt: new Date(Date.now() - getRandomInt(0, 60) * 24 * 60 * 60 * 1000),
                });
                followNotificationCount++;
            }
        }
        console.log(`  ✅ ${followNotificationCount} follow bildirimi oluşturuldu`);
        console.log('  - Message bildirimleri oluşturuluyor...');
        notifications.push(...messageNotifications);
        console.log(`  ✅ ${messageNotifications.length} message bildirimi oluşturuldu`);
        await NotificationModel.insertMany(notifications);
        console.log(`\n✅ Toplam ${notifications.length} notification oluşturuldu!`);
        console.log('\nReport\'lar oluşturuluyor...');
        const adminUser = users[0];
        const moderatorUser = users[1];
        const reports = [];
        for (let i = 0; i < 30; i++) {
            const randomPost = getRandomElement(insertedPosts);
            const reporter = getRandomElement(users.filter(u => u._id.toString() !== randomPost.userId.toString()));
            const reportCount = getRandomInt(1, 8);
            let priority = report_entity_1.ReportPriority.MEDIUM;
            if (reportCount >= 5)
                priority = report_entity_1.ReportPriority.HIGH;
            if (reportCount >= 8)
                priority = report_entity_1.ReportPriority.URGENT;
            const statuses = [report_entity_1.ReportStatus.PENDING, report_entity_1.ReportStatus.IN_REVIEW, report_entity_1.ReportStatus.RESOLVED, report_entity_1.ReportStatus.REJECTED];
            const status = i < 10 ? report_entity_1.ReportStatus.PENDING : (i < 20 ? report_entity_1.ReportStatus.IN_REVIEW : getRandomElement(statuses));
            reports.push({
                reporterId: reporter._id.toString(),
                reportedId: randomPost._id.toString(),
                type: report_entity_1.ReportType.POST,
                reason: getRandomElement([
                    report_entity_1.ReportReason.SPAM,
                    report_entity_1.ReportReason.INAPPROPRIATE_CONTENT,
                    report_entity_1.ReportReason.COPYRIGHT,
                    report_entity_1.ReportReason.FAKE_NEWS,
                    report_entity_1.ReportReason.OTHER,
                ]),
                description: `Bu gönderi hakkında şikayet: ${getRandomElement(['Uygunsuz içerik', 'Spam', 'Telif hakkı ihlali', 'Yanıltıcı bilgi', 'Diğer'])}`,
                status: status,
                priority: priority,
                reportCount: reportCount,
                reviewedBy: status !== report_entity_1.ReportStatus.PENDING ? (status === report_entity_1.ReportStatus.RESOLVED ? adminUser._id.toString() : moderatorUser._id.toString()) : null,
                reviewedAt: status !== report_entity_1.ReportStatus.PENDING ? new Date(Date.now() - getRandomInt(1, 30) * 24 * 60 * 60 * 1000) : null,
                adminNote: status === report_entity_1.ReportStatus.RESOLVED ? 'Şikayet incelendi ve gerekli işlem yapıldı.' : (status === report_entity_1.ReportStatus.REJECTED ? 'Şikayet geçersiz bulundu.' : ''),
                createdAt: new Date(Date.now() - getRandomInt(1, 60) * 24 * 60 * 60 * 1000),
            });
        }
        for (let i = 0; i < 20; i++) {
            const reportedUser = getRandomElement(users.slice(2));
            const reporter = getRandomElement(users.filter(u => u._id.toString() !== reportedUser._id.toString()));
            reports.push({
                reporterId: reporter._id.toString(),
                reportedId: reportedUser._id.toString(),
                type: report_entity_1.ReportType.USER,
                reason: getRandomElement([
                    report_entity_1.ReportReason.HARASSMENT,
                    report_entity_1.ReportReason.SPAM,
                    report_entity_1.ReportReason.INAPPROPRIATE_CONTENT,
                    report_entity_1.ReportReason.FAKE_NEWS,
                    report_entity_1.ReportReason.HATE_SPEECH,
                ]),
                description: `Bu kullanıcı hakkında şikayet: ${getRandomElement(['Taciz', 'Spam hesap', 'Sahte profil', 'Nefret söylemi', 'Uygunsuz davranış'])}`,
                status: i < 8 ? report_entity_1.ReportStatus.PENDING : report_entity_1.ReportStatus.IN_REVIEW,
                priority: i % 3 === 0 ? report_entity_1.ReportPriority.HIGH : report_entity_1.ReportPriority.MEDIUM,
                reportCount: getRandomInt(1, 5),
                reviewedBy: null,
                reviewedAt: null,
                adminNote: '',
                createdAt: new Date(Date.now() - getRandomInt(1, 45) * 24 * 60 * 60 * 1000),
            });
        }
        const insertedReports = await ReportModel.insertMany(reports);
        console.log(`✅ ${insertedReports.length} report oluşturuldu!`);
        console.log('\nReklamlar oluşturuluyor...');
        const ads = [];
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
            const isActive = i < 5;
            const adType = i % 2 === 0 ? ad_entity_1.AdType.IMAGE : ad_entity_1.AdType.VIDEO;
            ads.push({
                title: adTitles[i],
                type: adType,
                mediaUrl: adType === ad_entity_1.AdType.IMAGE
                    ? `https://picsum.photos/800/600?random=${i + 1000}`
                    : `https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4`,
                linkUrl: `https://example.com/campaign/${i + 1}`,
                description: `Özel kampanya fırsatları! ${i + 1}. kampanya detayları için tıklayın.`,
                status: isActive ? ad_entity_1.AdStatus.ACTIVE : (i < 7 ? ad_entity_1.AdStatus.PAUSED : ad_entity_1.AdStatus.DRAFT),
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
        console.log('\nActivity Log\'lar oluşturuluyor...');
        const activityLogs = [];
        const bannedUsers = users.slice(5, 15);
        for (let i = 0; i < 10; i++) {
            const targetUser = bannedUsers[i];
            const isPermanent = i % 3 === 0;
            activityLogs.push({
                adminId: adminUser._id.toString(),
                activityType: activity_log_entity_1.ActivityType.USER_BANNED,
                targetUserId: targetUser._id.toString(),
                description: `Kullanıcı ${isPermanent ? 'kalıcı olarak' : 'geçici olarak'} banlandı`,
                metadata: {
                    isPermanent: isPermanent,
                    bannedUntil: isPermanent ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    reason: 'Kurallara aykırı davranış',
                },
                createdAt: new Date(Date.now() - getRandomInt(1, 30) * 24 * 60 * 60 * 1000),
            });
            await UserModel.updateOne({ _id: targetUser._id }, {
                $set: {
                    isPermanentlyBanned: isPermanent,
                    bannedUntil: isPermanent ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
        }
        const warnedUsers = users.slice(15, 30);
        for (let i = 0; i < 15; i++) {
            const targetUser = warnedUsers[i];
            const warningCount = getRandomInt(1, 3);
            activityLogs.push({
                adminId: i % 2 === 0 ? adminUser._id.toString() : moderatorUser._id.toString(),
                activityType: activity_log_entity_1.ActivityType.USER_WARNED,
                targetUserId: targetUser._id.toString(),
                description: `Kullanıcıya uyarı verildi (Toplam uyarı: ${warningCount})`,
                metadata: {
                    warningCount: warningCount,
                    reason: 'Kurallara uygun olmayan içerik',
                },
                createdAt: new Date(Date.now() - getRandomInt(1, 45) * 24 * 60 * 60 * 1000),
            });
            await UserModel.updateOne({ _id: targetUser._id }, { $set: { warningCount: warningCount } });
        }
        const deletedPosts = insertedPosts.slice(10, 15);
        for (let i = 0; i < 5; i++) {
            const targetPost = deletedPosts[i];
            activityLogs.push({
                adminId: moderatorUser._id.toString(),
                activityType: activity_log_entity_1.ActivityType.POST_DELETED,
                targetPostId: targetPost._id.toString(),
                targetUserId: targetPost.userId.toString(),
                description: 'Gönderi admin tarafından silindi',
                metadata: {
                    reason: 'Uygunsuz içerik',
                },
                createdAt: new Date(Date.now() - getRandomInt(1, 20) * 24 * 60 * 60 * 1000),
            });
            await PostModel.updateOne({ _id: targetPost._id }, { $set: { deletedAt: new Date() } });
        }
        const resolvedReports = insertedReports.slice(20, 35);
        for (let i = 0; i < 15; i++) {
            const report = resolvedReports[i];
            if (report.status === report_entity_1.ReportStatus.RESOLVED) {
                activityLogs.push({
                    adminId: report.reviewedBy || adminUser._id.toString(),
                    activityType: activity_log_entity_1.ActivityType.REPORT_RESOLVED,
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
        for (let i = 0; i < 10; i++) {
            const ad = insertedAds[i];
            activityLogs.push({
                adminId: adminUser._id.toString(),
                activityType: activity_log_entity_1.ActivityType.AD_CREATED,
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
        console.log('\nAppeal\'lar oluşturuluyor...');
        const appeals = [];
        const appealUsers = bannedUsers.slice(0, 5);
        const banLogsMap = new Map();
        for (const log of insertedActivityLogs) {
            if (log.activityType === activity_log_entity_1.ActivityType.USER_BANNED) {
                banLogsMap.set(log.targetUserId.toString(), log._id.toString());
            }
        }
        for (let i = 0; i < 5; i++) {
            const appealUser = appealUsers[i];
            const banLogId = banLogsMap.get(appealUser._id.toString());
            if (banLogId) {
                const appealStatus = i < 2 ? appeal_entity_1.AppealStatus.PENDING : (i === 2 ? appeal_entity_1.AppealStatus.APPROVED : appeal_entity_1.AppealStatus.REJECTED);
                appeals.push({
                    userId: appealUser._id.toString(),
                    banLogId: banLogId,
                    reason: `Yanlış anlaşıldığımı düşünüyorum. ${i + 1}. itiraz nedeni detayları...`,
                    status: appealStatus,
                    reviewedBy: appealStatus !== appeal_entity_1.AppealStatus.PENDING ? adminUser._id.toString() : null,
                    reviewedAt: appealStatus !== appeal_entity_1.AppealStatus.PENDING ? new Date(Date.now() - getRandomInt(1, 10) * 24 * 60 * 60 * 1000) : null,
                    adminResponse: appealStatus === appeal_entity_1.AppealStatus.APPROVED
                        ? 'İtirazınız kabul edildi. Ban kaldırıldı.'
                        : appealStatus === appeal_entity_1.AppealStatus.REJECTED
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
        console.log('\n🔧 Kritik kullanıcı rollerini kontrol ediliyor...');
        const adminCredCheck = await UserCredentialsModel.findOne({ email: userData[0].email.toLowerCase() });
        if (adminCredCheck) {
            const adminUserCheck = await UserModel.findById(adminCredCheck.userId);
            if (adminUserCheck && adminUserCheck.role !== 'admin') {
                await UserModel.findByIdAndUpdate(adminCredCheck.userId, { role: 'admin' });
                console.log(`✅ ${userData[0].email} kullanıcısı admin rolüne ayarlandı.`);
            }
        }
        const moderatorCredCheck = await UserCredentialsModel.findOne({ email: userData[1].email.toLowerCase() });
        if (moderatorCredCheck) {
            const moderatorUserCheck = await UserModel.findById(moderatorCredCheck.userId);
            if (moderatorUserCheck && moderatorUserCheck.role !== 'moderator') {
                await UserModel.findByIdAndUpdate(moderatorCredCheck.userId, { role: 'moderator' });
                console.log(`✅ ${userData[1].email} kullanıcısı moderator rolüne ayarlandı.`);
            }
        }
        console.log('\n🔧 Kritik kullanıcı rollerini kontrol ediliyor...');
        const adminCred = await UserCredentialsModel.findOne({ email: userData[0].email.toLowerCase() });
        if (adminCred) {
            const adminUserDoc = await UserModel.findById(adminCred.userId);
            if (adminUserDoc && adminUserDoc.role !== 'admin') {
                await UserModel.findByIdAndUpdate(adminCred.userId, { role: 'admin' });
                console.log(`✅ ${userData[0].email} kullanıcısı admin rolüne ayarlandı.`);
            }
        }
        const moderatorCred = await UserCredentialsModel.findOne({ email: userData[1].email.toLowerCase() });
        if (moderatorCred) {
            const moderatorUserDoc = await UserModel.findById(moderatorCred.userId);
            if (moderatorUserDoc && moderatorUserDoc.role !== 'moderator') {
                await UserModel.findByIdAndUpdate(moderatorCred.userId, { role: 'moderator' });
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
    }
    catch (error) {
        console.error('Seed işlemi sırasında hata oluştu:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=seed.js.map