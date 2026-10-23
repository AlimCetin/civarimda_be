import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class NotBlockedGuard implements CanActivate {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

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

    const currentUserId = user.id || user._id;

    // Check if target user has blocked current user
    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
      select: ['id', 'blockedUsers'],
    });

    if (targetUser?.blockedUsers?.includes(currentUserId)) {
      throw new ForbiddenException('You are blocked by this user');
    }

    // Check if current user has blocked target user
    if (user.blockedUsers?.includes(targetUserId)) {
      throw new ForbiddenException('You have blocked this user');
    }

    return true;
  }
}
