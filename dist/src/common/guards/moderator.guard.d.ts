import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
export declare class ModeratorGuard implements CanActivate {
    private userRepository;
    constructor(userRepository: Repository<User>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
