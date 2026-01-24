import { IsOptional, IsBoolean, IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class UpdateVisibilityDto {
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hiddenFromFollowers?: string[];
}


