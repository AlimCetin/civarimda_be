import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from '../../entities/user.entity';
export declare class ModeratorGuard implements CanActivate {
    private userModel;
    constructor(userModel: Model<User>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
