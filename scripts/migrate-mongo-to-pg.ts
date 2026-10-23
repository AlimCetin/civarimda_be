import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import * as mongoose from 'mongoose';
import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { UserCredentials } from '../src/entities/user-credentials.entity';
import { Post } from '../src/entities/post.entity';
import { Comment } from '../src/entities/comment.entity';
import { Conversation } from '../src/entities/conversation.entity';
import { Message } from '../src/entities/message.entity';
import { Notification } from '../src/entities/notification.entity';
import { Report } from '../src/entities/report.entity';
import { Appeal } from '../src/entities/appeal.entity';
import { ActivityLog } from '../src/entities/activity-log.entity';
import { Ad } from '../src/entities/ad.entity';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civarimda';

const postgresDataSource = new DataSource(
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

function toStringId(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (val._id) return val._id.toString();
  if (val.toString) return val.toString();
  return String(val);
}

function toStringArray(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => toStringId(item)).filter(Boolean) as string[];
}

async function runMigration() {
  console.log('==================================================');
  console.log('🚀 MongoDB to PostgreSQL Data Migration Tool');
  console.log('==================================================');

  console.log(`Connecting to MongoDB at: ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB.');

  console.log('Connecting to PostgreSQL and synchronizing schema...');
  await postgresDataSource.initialize();
  console.log('✅ Connected to PostgreSQL.');

  const mongoDb = mongoose.connection.db;
  if (!mongoDb) {
    throw new Error('MongoDB database instance is not available');
  }

  const collections = await mongoDb.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);
  console.log('Found MongoDB collections:', collectionNames.join(', '));

  // 1. Migrate Users
  const userCollection = mongoDb.collection('users');
  const mongoUsers = await userCollection.find({}).toArray();
  console.log(`\n📦 Migrating Users (${mongoUsers.length} documents)...`);
  const userRepo = postgresDataSource.getRepository(User);

  for (const doc of mongoUsers) {
    const userId = doc._id.toString();
    const existing = await userRepo.findOne({ where: { id: userId } });
    const user = existing || new User();

    user.id = userId;
    user.fullName = doc.fullName || '';
    user.avatar = doc.avatar || null;
    user.bio = doc.bio || '';
    user.followers = toStringArray(doc.followers);
    user.following = toStringArray(doc.following);
    user.blockedUsers = toStringArray(doc.blockedUsers);
    user.savedPosts = toStringArray(doc.savedPosts);
    user.isVerified = Boolean(doc.isVerified);
    user.hideFollowers = Boolean(doc.hideFollowers);
    user.hideFollowing = Boolean(doc.hideFollowing);
    user.hiddenFollowers = toStringArray(doc.hiddenFollowers);
    user.hiddenFollowing = toStringArray(doc.hiddenFollowing);
    user.role = doc.role || 'user';
    user.warningCount = doc.warningCount || 0;
    user.bannedUntil = doc.bannedUntil ? new Date(doc.bannedUntil) : null;
    user.isPermanentlyBanned = Boolean(doc.isPermanentlyBanned);
    user.deletedAt = doc.deletedAt ? new Date(doc.deletedAt) : null;
    user.createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
    user.updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date();

    await userRepo.save(user);
  }
  console.log(`✅ Migrated ${mongoUsers.length} Users.`);

  // 2. Migrate UserCredentials
  const credsCollectionName = collectionNames.find(
    (n) => n === 'usercredentials' || n === 'user_credentials',
  );
  if (credsCollectionName) {
    const credsCollection = mongoDb.collection(credsCollectionName);
    const mongoCreds = await credsCollection.find({}).toArray();
    console.log(`\n📦 Migrating UserCredentials (${mongoCreds.length} documents)...`);
    const credsRepo = postgresDataSource.getRepository(UserCredentials);

    for (const doc of mongoCreds) {
      const credId = doc._id.toString();
      const existing = await credsRepo.findOne({ where: { id: credId } });
      const creds = existing || new UserCredentials();

      creds.id = credId;
      creds.userId = toStringId(doc.userId) || credId;
      creds.email = (doc.email || '').toLowerCase().trim();
      creds.password = doc.password || '';
      creds.refreshToken = doc.refreshToken || null;
      creds.createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
      creds.updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date();

      await credsRepo.save(creds);
    }
    console.log(`✅ Migrated ${mongoCreds.length} UserCredentials.`);
  }

  // 3. Migrate Posts
  const postCollection = mongoDb.collection('posts');
  const mongoPosts = await postCollection.find({}).toArray();
  console.log(`\n📦 Migrating Posts (${mongoPosts.length} documents)...`);
  const postRepo = postgresDataSource.getRepository(Post);

  for (const doc of mongoPosts) {
    const postId = doc._id.toString();
    const existing = await postRepo.findOne({ where: { id: postId } });
    const post = existing || new Post();

    post.id = postId;
    post.userId = toStringId(doc.userId) || '';
    post.image = doc.image || null;
    post.video = doc.video || null;
    post.caption = doc.caption || '';
    post.likes = toStringArray(doc.likes);
    post.commentCount = doc.commentCount || 0;
    post.isHidden = Boolean(doc.isHidden);
    post.isPrivate = Boolean(doc.isPrivate);
    post.hiddenFromFollowers = toStringArray(doc.hiddenFromFollowers);
    post.deletedAt = doc.deletedAt ? new Date(doc.deletedAt) : null;
    post.createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
    post.updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date();

    await postRepo.save(post);
  }
  console.log(`✅ Migrated ${mongoPosts.length} Posts.`);

  // 4. Migrate Comments
  const commentCollection = mongoDb.collection('comments');
  const mongoComments = await commentCollection.find({}).toArray();
  console.log(`\n📦 Migrating Comments (${mongoComments.length} documents)...`);
  const commentRepo = postgresDataSource.getRepository(Comment);

  for (const doc of mongoComments) {
    const commentId = doc._id.toString();
    const existing = await commentRepo.findOne({ where: { id: commentId } });
    const comment = existing || new Comment();

    comment.id = commentId;
    comment.postId = toStringId(doc.postId) || '';
    comment.userId = toStringId(doc.userId) || '';
    comment.text = doc.text || '';
    comment.deletedAt = doc.deletedAt ? new Date(doc.deletedAt) : null;
    comment.createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
    comment.updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date();

    await commentRepo.save(comment);
  }
  console.log(`✅ Migrated ${mongoComments.length} Comments.`);

  // 5. Migrate Conversations
  const convCollection = mongoDb.collection('conversations');
  const mongoConvs = await convCollection.find({}).toArray();
  console.log(`\n📦 Migrating Conversations (${mongoConvs.length} documents)...`);
  const convRepo = postgresDataSource.getRepository(Conversation);

  for (const doc of mongoConvs) {
    const convId = doc._id.toString();
    const existing = await convRepo.findOne({ where: { id: convId } });
    const conv = existing || new Conversation();

    conv.id = convId;
    conv.participants = toStringArray(doc.participants);
    conv.lastMessage = toStringId(doc.lastMessage);
    conv.lastMessageAt = doc.lastMessageAt ? new Date(doc.lastMessageAt) : new Date();
    conv.deletedAt = doc.deletedAt ? new Date(doc.deletedAt) : null;
    conv.createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
    conv.updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date();

    await convRepo.save(conv);
  }
  console.log(`✅ Migrated ${mongoConvs.length} Conversations.`);

  // 6. Migrate Messages
  const msgCollection = mongoDb.collection('messages');
  const mongoMsgs = await msgCollection.find({}).toArray();
  console.log(`\n📦 Migrating Messages (${mongoMsgs.length} documents)...`);
  const msgRepo = postgresDataSource.getRepository(Message);

  for (const doc of mongoMsgs) {
    const msgId = doc._id.toString();
    const existing = await msgRepo.findOne({ where: { id: msgId } });
    const msg = existing || new Message();

    msg.id = msgId;
    msg.conversationId = toStringId(doc.conversationId) || '';
    msg.senderId = toStringId(doc.senderId) || '';
    msg.text = doc.text || '';
    msg.read = Boolean(doc.read);
    msg.deletedAt = doc.deletedAt ? new Date(doc.deletedAt) : null;
    msg.createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
    msg.updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date();

    await msgRepo.save(msg);
  }
  console.log(`✅ Migrated ${mongoMsgs.length} Messages.`);

  // 7. Migrate Notifications
  const notifCollection = mongoDb.collection('notifications');
  const mongoNotifs = await notifCollection.find({}).toArray();
  console.log(`\n📦 Migrating Notifications (${mongoNotifs.length} documents)...`);
  const notifRepo = postgresDataSource.getRepository(Notification);

  for (const doc of mongoNotifs) {
    const notifId = doc._id.toString();
    const existing = await notifRepo.findOne({ where: { id: notifId } });
    const notif = existing || new Notification();

    notif.id = notifId;
    notif.userId = toStringId(doc.userId) || '';
    notif.fromUserId = toStringId(doc.fromUserId) || '';
    notif.type = doc.type || 'message';
    notif.postId = toStringId(doc.postId);
    notif.postOwnerName = doc.postOwnerName || null;
    notif.isFollowerNotification = Boolean(doc.isFollowerNotification);
    notif.read = Boolean(doc.read);
    notif.deletedAt = doc.deletedAt ? new Date(doc.deletedAt) : null;
    notif.createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
    notif.updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date();

    await notifRepo.save(notif);
  }
  console.log(`✅ Migrated ${mongoNotifs.length} Notifications.`);

  // 8. Migrate Reports
  const reportCollection = mongoDb.collection('reports');
  const mongoReports = await reportCollection.find({}).toArray();
  console.log(`\n📦 Migrating Reports (${mongoReports.length} documents)...`);
  const reportRepo = postgresDataSource.getRepository(Report);

  for (const doc of mongoReports) {
    const repId = doc._id.toString();
    const existing = await reportRepo.findOne({ where: { id: repId } });
    const report = existing || new Report();

    report.id = repId;
    report.reporterId = toStringId(doc.reporterId) || '';
    report.reportedId = toStringId(doc.reportedId) || '';
    report.type = doc.type;
    report.reason = doc.reason;
    report.description = doc.description || '';
    report.status = doc.status;
    report.priority = doc.priority;
    report.reviewedBy = toStringId(doc.reviewedBy);
    report.reviewedAt = doc.reviewedAt ? new Date(doc.reviewedAt) : null;
    report.adminNote = doc.adminNote || '';
    report.reportCount = doc.reportCount || 1;
    report.createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
    report.updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date();

    await reportRepo.save(report);
  }
  console.log(`✅ Migrated ${mongoReports.length} Reports.`);

  // 9. Migrate ActivityLogs
  const actCollectionName = collectionNames.find(
    (n) => n === 'activitylogs' || n === 'activity_logs',
  );
  if (actCollectionName) {
    const actCollection = mongoDb.collection(actCollectionName);
    const mongoLogs = await actCollection.find({}).toArray();
    console.log(`\n📦 Migrating ActivityLogs (${mongoLogs.length} documents)...`);
    const actRepo = postgresDataSource.getRepository(ActivityLog);

    for (const doc of mongoLogs) {
      const logId = doc._id.toString();
      const existing = await actRepo.findOne({ where: { id: logId } });
      const log = existing || new ActivityLog();

      log.id = logId;
      log.adminId = toStringId(doc.adminId) || '';
      log.activityType = doc.activityType;
      log.targetUserId = toStringId(doc.targetUserId);
      log.targetPostId = toStringId(doc.targetPostId);
      log.targetReportId = toStringId(doc.targetReportId);
      log.targetAdId = toStringId(doc.targetAdId);
      log.description = doc.description || '';
      log.metadata = doc.metadata || {};
      log.createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
      log.updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date();

      await actRepo.save(log);
    }
    console.log(`✅ Migrated ${mongoLogs.length} ActivityLogs.`);
  }

  // 10. Migrate Appeals
  const appealCollection = mongoDb.collection('appeals');
  const mongoAppeals = await appealCollection.find({}).toArray();
  console.log(`\n📦 Migrating Appeals (${mongoAppeals.length} documents)...`);
  const appealRepo = postgresDataSource.getRepository(Appeal);

  for (const doc of mongoAppeals) {
    const appealId = doc._id.toString();
    const existing = await appealRepo.findOne({ where: { id: appealId } });
    const appeal = existing || new Appeal();

    appeal.id = appealId;
    appeal.userId = toStringId(doc.userId) || '';
    appeal.banLogId = toStringId(doc.banLogId) || '';
    appeal.reason = doc.reason || '';
    appeal.status = doc.status;
    appeal.reviewedBy = toStringId(doc.reviewedBy);
    appeal.reviewedAt = doc.reviewedAt ? new Date(doc.reviewedAt) : null;
    appeal.adminResponse = doc.adminResponse || '';
    appeal.conversation = doc.conversation || [];
    appeal.createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
    appeal.updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date();

    await appealRepo.save(appeal);
  }
  console.log(`✅ Migrated ${mongoAppeals.length} Appeals.`);

  // 11. Migrate Ads
  const adCollection = mongoDb.collection('ads');
  const mongoAds = await adCollection.find({}).toArray();
  console.log(`\n📦 Migrating Ads (${mongoAds.length} documents)...`);
  const adRepo = postgresDataSource.getRepository(Ad);

  for (const doc of mongoAds) {
    const adId = doc._id.toString();
    const existing = await adRepo.findOne({ where: { id: adId } });
    const ad = existing || new Ad();

    ad.id = adId;
    ad.title = doc.title || '';
    ad.type = doc.type;
    ad.mediaUrl = doc.mediaUrl || '';
    ad.linkUrl = doc.linkUrl || '';
    ad.description = doc.description || '';
    ad.status = doc.status;
    ad.startDate = new Date(doc.startDate);
    ad.endDate = new Date(doc.endDate);
    ad.clickCount = doc.clickCount || 0;
    ad.viewCount = doc.viewCount || 0;
    ad.impressionCount = doc.impressionCount || 0;
    ad.createdBy = toStringId(doc.createdBy);
    ad.maxImpressions = doc.maxImpressions || 0;
    ad.budget = doc.budget || 0;
    ad.spentAmount = doc.spentAmount || 0;
    ad.createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
    ad.updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date();

    await adRepo.save(ad);
  }
  console.log(`✅ Migrated ${mongoAds.length} Ads.`);

  console.log('\n==================================================');
  console.log('🎉 Migration Completed Successfully!');
  console.log('==================================================');

  await mongoose.disconnect();
  await postgresDataSource.destroy();
  process.exit(0);
}

runMigration().catch((error) => {
  console.error('\n❌ Migration failed with error:', error);
  process.exit(1);
});
