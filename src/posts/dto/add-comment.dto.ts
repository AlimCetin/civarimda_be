import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AddCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Comment text is required' })
  @MaxLength(1000, { message: 'Comment must be at most 1000 characters' })
  text: string;
}

