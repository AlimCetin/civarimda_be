import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
import { User } from '../../entities/user.entity';

@Injectable()
export class NotBlockedGuard implements CanActivate {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetUserId = request.params.userId;

    if (!user || !targetUserId) {
      return true; // Let other guards handle this
    }

    // Skip validation for special values like "current-user-id" or "me"
    if (targetUserId === 'current-user-id' || targetUserId === 'me') {
      return true;
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(targetUserId)) {
      return true; // Invalid ObjectId, let the controller handle the error
    }

    // Check if target user has blocked current user
    const targetUser = await this.userModel.findById(targetUserId).select('blockedUsers');
    if (targetUser?.blockedUsers?.includes(user._id.toString())) {
      throw new ForbiddenException('You are blocked by this user');
    }

    // Check if current user has blocked target user
    if (user.blockedUsers?.includes(targetUserId)) {
      throw new ForbiddenException('You have blocked this user');
    }

    return true;
  }
}
