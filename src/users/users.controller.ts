import { Controller, Get, Param, Query, Put, Body, Delete, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { NotBlockedGuard } from '../common/guards/not-blocked.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Types } from 'mongoose';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: User) {
    const userObj = user.toObject();
    return {
      ...userObj,
      id: userObj._id.toString(),
      _id: userObj._id.toString(),
      followerCount: userObj.followers?.length || 0,
      followingCount: userObj.following?.length || 0,
    };
  }

  @Get('search')
  async search(@Query('q') query: string) {
    return this.usersService.search(query);
  }

  @Get('blocked/list')
  async getBlocked(@CurrentUser() user: User) {
    return this.usersService.getBlockedUsers(user._id.toString());
  }

  @Get(':userId')
  @UseGuards(NotBlockedGuard)
  async getUser(@Param('userId') userId: string, @CurrentUser() user: User) {
    // Handle special values for current user
    if (userId === 'current-user-id' || userId === 'me') {
      const userObj = user.toObject();
      return {
        ...userObj,
        id: userObj._id.toString(),
        _id: userObj._id.toString(),
        followerCount: userObj.followers?.length || 0,
        followingCount: userObj.following?.length || 0,
      };
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    return this.usersService.findById(userId, user._id.toString());
  }

  @Get(':userId/followers')
  @UseGuards(NotBlockedGuard)
  async getFollowers(@Param('userId') userId: string, @CurrentUser() user: User) {
    // Handle special values for current user
    if (userId === 'current-user-id' || userId === 'me') {
      return this.usersService.getFollowers(user._id.toString(), user._id.toString());
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    return this.usersService.getFollowers(userId, user._id.toString());
  }

  @Get(':userId/following')
  @UseGuards(NotBlockedGuard)
  async getFollowing(@Param('userId') userId: string, @CurrentUser() user: User) {
    // Handle special values for current user
    if (userId === 'current-user-id' || userId === 'me') {
      return this.usersService.getFollowing(user._id.toString(), user._id.toString());
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    return this.usersService.getFollowing(userId, user._id.toString());
  }

  @Post(':userId/follow')
  @UseGuards(NotBlockedGuard)
  async follow(@Param('userId') userId: string, @CurrentUser() user: User) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    return this.usersService.follow(userId, user._id.toString());
  }

  @Delete(':userId/follow')
  async unfollow(@Param('userId') userId: string, @CurrentUser() user: User) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    return this.usersService.unfollow(userId, user._id.toString());
  }

  @Post(':userId/block')
  async block(@Param('userId') userId: string, @CurrentUser() user: User) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    return this.usersService.block(userId, user._id.toString());
  }

  @Delete(':userId/block')
  async unblock(@Param('userId') userId: string, @CurrentUser() user: User) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    return this.usersService.unblock(userId, user._id.toString());
  }

  @Put('profile')
  async updateProfile(@Body() data: UpdateProfileDto, @CurrentUser() user: User) {
    // Only allow users to update their own profile
    return this.usersService.updateProfile(user._id.toString(), data);
  }

  @Delete('account')
  async deleteAccount(@CurrentUser() user: User) {
    await this.usersService.deleteAccount(user._id.toString());
    return { message: 'Account deleted successfully' };
  }
}
