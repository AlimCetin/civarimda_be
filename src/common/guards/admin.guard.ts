import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userDoc = await this.userModel.findById(user._id || user.id).select('role');
    if (!userDoc) {
      throw new ForbiddenException('User not found');
    }

    const allowedRoles = ['admin', 'super_admin'];
    if (!allowedRoles.includes(userDoc.role)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}

