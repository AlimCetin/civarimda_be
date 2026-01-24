import { IsString, IsOptional, MaxLength, IsUrl, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Full name must be at most 50 characters' })
  fullName?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'Bio must be at most 150 characters' })
  bio?: string;

  @IsOptional()
  hideFollowers?: boolean;

  @IsOptional()
  hideFollowing?: boolean;

  @IsOptional()
  hiddenFollowers?: string[];

  @IsOptional()
  hiddenFollowing?: string[];
}

