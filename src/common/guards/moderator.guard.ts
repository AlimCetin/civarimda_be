import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class ModeratorGuard implements CanActivate {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userId = user.id || user._id;
    const userDoc = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'role'],
    });

    if (!userDoc) {
      throw new ForbiddenException('User not found');
    }

    const allowedRoles = ['admin', 'super_admin', 'moderator'];
    if (!allowedRoles.includes(userDoc.role)) {
      throw new ForbiddenException('Moderator access required');
    }

    return true;
  }
}
