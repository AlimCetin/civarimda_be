import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class OwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    const resourceUserId = request.params.userId;

    if (!user || !resourceUserId) {
      throw new ForbiddenException('Access denied');
    }

    if (user._id.toString() !== resourceUserId) {
      throw new ForbiddenException('You can only access your own resources');
    }

    return true;
  }
}

