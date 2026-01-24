import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, BadRequestException, ParseIntPipe, DefaultValuePipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { NotBlockedGuard } from '../common/guards/not-blocked.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { Types } from 'mongoose';
import { multerConfig } from '../config/multer.config';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private postsService: PostsService) { }

  @Post('upload-media')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadMedia(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is not provided or invalid type');
    }
    // Windows path separatorlerini (\\) forward slash (/) ile değiştir
    const normalizedPath = file.path.replace(/\\/g, '/');
    // '1_backend/' prefixini kaldır (eğer varsa) ve root relative path dön
    // file.path genellikle 'uploads/videos/xyz.mp4' veya '1_backend/uploads/...' döner
    // Biz client'a '/uploads/videos/xyz.mp4' formatında dönmeliyiz

    // Eğer path 'uploads' ile başlamıyorsa düzelt
    const relativePath = normalizedPath.includes('uploads/')
      ? normalizedPath.substring(normalizedPath.indexOf('uploads/'))
      : normalizedPath;

    return { url: `/${relativePath}` };
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreatePostDto,
    @CurrentUser() user: User
  ) {
    let videoUrl = (body as any).video;

    // Eğer dosya yüklendiyse, URL oluştur
    if (file) {
      // Windows path separatorlerini (\\) forward slash (/) ile değiştir
      const normalizedPath = file.path.replace(/\\/g, '/');
      const relativePath = normalizedPath.includes('uploads/')
        ? normalizedPath.substring(normalizedPath.indexOf('uploads/'))
        : normalizedPath;
      videoUrl = `/${relativePath}`;
    }

    return this.postsService.create(
      user._id.toString(),
      body.image,
      body.caption || '',
      (body.isPrivate as any) === 'true' || body.isPrivate === true || false, // FormData string olarak gelebilir
      body.hiddenFromFollowers || [], // TODO: JSON parse gerekebilir string gelirse
      videoUrl
    );
  }

  @Get(':postId/likes')
  async getLikes(
    @Param('postId') postId: string,
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID format');
    }
    return this.postsService.getLikes(postId, user._id.toString(), page, limit);
  }

  @Get('feed')
  async getFeed(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.postsService.getFeed(user._id.toString(), page, limit);
  }

  @Get('user/:userId')
  @UseGuards(NotBlockedGuard)
  async getUserPosts(
    @Param('userId') userId: string,
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    // Handle special values for current user
    if (userId === 'current-user-id' || userId === 'me') {
      return this.postsService.getUserPosts(user._id.toString(), user._id.toString(), page, limit);
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    return this.postsService.getUserPosts(userId, user._id.toString(), page, limit);
  }

  @Post(':postId/like')
  async like(@Param('postId') postId: string, @CurrentUser() user: User) {
    return this.postsService.like(postId, user._id.toString());
  }

  @Delete(':postId/like')
  async unlike(@Param('postId') postId: string, @CurrentUser() user: User) {
    return this.postsService.unlike(postId, user._id.toString());
  }

  @Get(':postId/comments')
  async getComments(
    @Param('postId') postId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.postsService.getComments(postId, page, limit);
  }

  @Post(':postId/comments')
  async addComment(@Param('postId') postId: string, @Body() body: AddCommentDto, @CurrentUser() user: User) {
    return this.postsService.addComment(postId, user._id.toString(), body.text);
  }

  @Post(':postId/save')
  async savePost(@Param('postId') postId: string, @CurrentUser() user: User) {
    return this.postsService.savePost(postId, user._id.toString());
  }

  @Delete(':postId/save')
  async unsavePost(@Param('postId') postId: string, @CurrentUser() user: User) {
    return this.postsService.unsavePost(postId, user._id.toString());
  }

  @Get('saved')
  async getSavedPosts(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.postsService.getSavedPosts(user._id.toString(), page, limit);
  }

  @Get(':postId/share')
  async getPostForShare(@Param('postId') postId: string, @CurrentUser() user: User) {
    return this.postsService.sharePost(postId, user._id.toString(), '');
  }

  @Get(':postId')
  async getPost(
    @Param('postId') postId: string,
    @CurrentUser() user: User,
  ) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID format');
    }
    return this.postsService.getPostById(postId, user._id.toString());
  }

  @Post(':postId/hide')
  async hidePost(@Param('postId') postId: string, @CurrentUser() user: User) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID format');
    }
    return this.postsService.hidePost(postId, user._id.toString());
  }

  @Post(':postId/unhide')
  async unhidePost(@Param('postId') postId: string, @CurrentUser() user: User) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID format');
    }
    return this.postsService.unhidePost(postId, user._id.toString());
  }

  @Put(':postId/visibility')
  async updateVisibility(
    @Param('postId') postId: string,
    @Body() body: UpdateVisibilityDto,
    @CurrentUser() user: User,
  ) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID format');
    }
    return this.postsService.updateVisibility(postId, user._id.toString(), body);
  }

  @Delete(':postId')
  async deletePost(@Param('postId') postId: string, @CurrentUser() user: User) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID format');
    }
    return this.postsService.deletePost(postId, user._id.toString());
  }
}
