import { IsEnum } from 'class-validator';

export class ChangeRoleDto {
  @IsEnum(['user', 'moderator', 'admin', 'super_admin'])
  role: string;
}

