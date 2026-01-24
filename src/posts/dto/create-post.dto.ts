import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsOptional()
  @IsString({ message: 'Image must be a string (base64 or URL)' })
  image?: string;

  @IsOptional()
  @IsString({ message: 'Video must be a string (base64 or URL)' })
  video?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2200, { message: 'Caption must be at most 2200 characters' })
  caption?: string;

  @IsOptional()
  isPrivate?: boolean;

  @IsOptional()
  hiddenFromFollowers?: string[];
}

