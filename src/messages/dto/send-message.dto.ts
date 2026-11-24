import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * Mesaj gönderme isteği için doğrulama DTO'su.
 */
export class SendMessageDto {
  @IsUUID('4', { message: 'Geçersiz alıcı kimliği.' })
  receiverId: string;

  @IsString()
  @IsNotEmpty({ message: 'Mesaj içeriği boş olamaz.' })
  @MaxLength(2000, { message: 'Mesaj en fazla 2000 karakter olabilir.' })
  text: string;
}

