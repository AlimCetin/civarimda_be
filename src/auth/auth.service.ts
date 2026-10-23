import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { UserCredentials } from '../entities/user-credentials.entity';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { AppLoggerService } from '../common/logger/logger.service';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserCredentials) private credentialsRepository: Repository<UserCredentials>,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(AppLoggerService) private readonly logger: AppLoggerService,
    private readonly redisService: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const emailLower = dto.email.toLowerCase().trim();
    
    // Check if user credentials already exist
    const exists = await this.credentialsRepository.findOne({ where: { email: emailLower } });
    if (exists) throw new ConflictException('User already exists');

    const user = this.userRepository.create({
      fullName: dto.fullName,
    });
    await this.userRepository.save(user);

    // Create credentials separately
    const credentials = this.credentialsRepository.create({
      userId: user.id,
      email: emailLower,
      password: dto.password,
    });
    await this.credentialsRepository.save(credentials);

    const tokens = await this.generateTokens(user.id);
    
    // Store refresh token in Redis (TTL: 7 days = 604800 seconds)
    await this.redisService.set(
      `refresh_token:${user.id}`,
      tokens.refreshToken,
      604800
    );
    
    // Also update database
    await this.credentialsRepository.update(
      { userId: user.id },
      { refreshToken: tokens.refreshToken }
    );

    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async login(dto: LoginDto) {
    const emailLower = dto.email.toLowerCase().trim();
    
    // Query credentials including hidden fields
    const credentials = await this.credentialsRepository
      .createQueryBuilder('c')
      .addSelect('c.password')
      .addSelect('c.refreshToken')
      .where('c.email = :email', { email: emailLower })
      .getOne();
    
    if (!credentials || !(await credentials.comparePassword(dto.password))) {
      this.logger.securityEvent('Failed login attempt', {
        email: emailLower,
        reason: credentials ? 'Invalid password' : 'User not found',
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.userRepository.findOne({ where: { id: credentials.userId } });
    if (!user) {
      this.logger.securityEvent('Failed login attempt', {
        email: emailLower,
        reason: 'User not found after credentials match',
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in successfully: ${emailLower}`, 'AuthService');

    const tokens = await this.generateTokens(user.id);
    
    // Store refresh token in Redis (TTL: 7 days = 604800 seconds)
    await this.redisService.set(
      `refresh_token:${user.id}`,
      tokens.refreshToken,
      604800
    );
    
    // Also update database
    await this.credentialsRepository.update(
      { email: emailLower },
      { refreshToken: tokens.refreshToken }
    );

    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 
                           this.configService.get<string>('JWT_SECRET');
      
      if (!refreshSecret) {
        throw new UnauthorizedException('JWT secret not configured');
      }

      // Verify refresh token
      let payload: any;
      try {
        payload = this.jwtService.verify(dto.refreshToken, {
          secret: refreshSecret,
        });
      } catch (error) {
        this.logger.securityEvent('Invalid refresh token attempt', {
          reason: 'Token verification failed',
          timestamp: new Date().toISOString(),
        });
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Check if refresh token exists in Redis
      const storedToken = await this.redisService.get(`refresh_token:${payload.id}`);
      
      if (!storedToken) {
        this.logger.securityEvent('Invalid refresh token attempt', {
          userId: payload.id,
          reason: 'Refresh token not found in Redis',
          timestamp: new Date().toISOString(),
        });
        throw new UnauthorizedException('Refresh token not found');
      }

      // Verify refresh token matches
      if (storedToken !== dto.refreshToken) {
        this.logger.securityEvent('Invalid refresh token attempt', {
          userId: payload.id,
          reason: 'Refresh token mismatch',
          timestamp: new Date().toISOString(),
        });
        throw new UnauthorizedException('Refresh token mismatch');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(payload.id);
      
      // Update refresh token in Redis (TTL: 7 days = 604800 seconds)
      await this.redisService.set(
        `refresh_token:${payload.id}`,
        tokens.refreshToken,
        604800
      );
      
      // Also update database
      await this.credentialsRepository.update(
        { userId: payload.id },
        { refreshToken: tokens.refreshToken }
      );

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string) {
    const payload = { id: userId };
    
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || jwtSecret;
    
    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User) {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete (obj as any).password;
    return obj;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const credentials = await this.credentialsRepository
      .createQueryBuilder('c')
      .addSelect('c.password')
      .where('c.userId = :userId', { userId })
      .getOne();
    
    if (!credentials) {
      throw new UnauthorizedException('User credentials not found');
    }

    if (!(await credentials.comparePassword(currentPassword))) {
      this.logger.securityEvent('Failed password change attempt', {
        userId: userId.toString(),
        reason: 'Invalid current password',
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (await credentials.comparePassword(newPassword)) {
      throw new BadRequestException('New password must be different from current password');
    }

    credentials.password = newPassword;
    await this.credentialsRepository.save(credentials);

    this.logger.securityEvent('Password changed successfully', {
      userId: userId.toString(),
      timestamp: new Date().toISOString(),
    });

    return { message: 'Password changed successfully' };
  }

  async logout(userId: string): Promise<{ message: string }> {
    // Delete refresh token from Redis
    await this.redisService.del(`refresh_token:${userId}`);
    
    // Clear from database
    await this.credentialsRepository.update(
      { userId },
      { refreshToken: null }
    );

    this.logger.log(`User logged out: ${userId}`, 'AuthService');
    return { message: 'Logged out successfully' };
  }
}
