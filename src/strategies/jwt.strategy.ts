import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

interface JwtPayload {
  id: string;
  type?: 'access' | 'refresh';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET') || (() => {
        throw new Error('JWT_SECRET environment variable is required');
      })(),
    });
  }

  async validate(payload: JwtPayload) {
    // Refresh token'ın access token olarak kullanılmasını engelle
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Geçersiz erişim token türü.');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.id, deletedAt: IsNull() },
    });
    if (!user) throw new UnauthorizedException();

    // Kalıcı veya geçici olarak banlanmış kullanıcıların erişimini engelle
    if (user.isPermanentlyBanned) {
      throw new UnauthorizedException('Hesabınız kalıcı olarak askıya alınmıştır.');
    }
    if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
      throw new UnauthorizedException('Hesabınız geçici olarak askıya alınmıştır.');
    }

    return user;
  }
}
