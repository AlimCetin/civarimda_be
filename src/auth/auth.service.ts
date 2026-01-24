import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { User } from '../entities/user.entity';
import { UserCredentials } from '../entities/user-credentials.entity';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { AppLoggerService } from '../common/logger/logger.service';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserCredentials.name) private credentialsModel: Model<UserCredentials>,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(AppLoggerService) private readonly logger: AppLoggerService,
    private readonly redisService: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const emailLower = dto.email.toLowerCase().trim();
    
    // Email kontrolünü credentials tablosundan yap
    const exists = await this.credentialsModel.findOne({ email: emailLower });
    if (exists) throw new ConflictException('User already exists');

    const user = await this.userModel.create({
      fullName: dto.fullName,
    });

    // Create credentials separately
    await this.credentialsModel.create({
      userId: user._id,
      email: emailLower,
      password: dto.password,
    });

    const tokens = await this.generateTokens(user._id.toString());
    
    // Store refresh token in Redis (TTL: 7 days = 604800 seconds)
    await this.redisService.set(
      `refresh_token:${user._id.toString()}`,
      tokens.refreshToken,
      604800
    );
    
    // Also update MongoDB for backward compatibility (optional, can be removed later)
    await this.credentialsModel.findOneAndUpdate(
      { userId: user._id },
      { refreshToken: tokens.refreshToken }
    );

    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async login(dto: LoginDto) {
    const emailLower = dto.email.toLowerCase().trim();
    
    // Direkt email ile credentials tablosundan sorgulama
    const credentials = await this.credentialsModel
      .findOne({ email: emailLower })
      .select('+password +refreshToken');
    
    if (!credentials || !(await credentials.comparePassword(dto.password))) {
      // Security event logging for failed login
      this.logger.securityEvent('Failed login attempt', {
        email: emailLower,
        reason: credentials ? 'Invalid password' : 'User not found',
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.userModel.findById(credentials.userId);
    if (!user) {
      this.logger.securityEvent('Failed login attempt', {
        email: emailLower,
        reason: 'User not found after credentials match',
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Successful login logging
    this.logger.log(`User logged in successfully: ${emailLower}`, 'AuthService');

    const tokens = await this.generateTokens(user._id.toString());
    
    // Store refresh token in Redis (TTL: 7 days = 604800 seconds)
    await this.redisService.set(
      `refresh_token:${user._id.toString()}`,
      tokens.refreshToken,
      604800
    );
    
    // Also update MongoDB for backward compatibility (optional, can be removed later)
    await this.credentialsModel.findOneAndUpdate(
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
      
      // Also update MongoDB for backward compatibility (optional, can be removed later)
      await this.credentialsModel.findOneAndUpdate(
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
    
    // Access token - 1 saat (daha uzun süre için)
    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '1h',
    });

    // Refresh token - 7 gün
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private   sanitizeUser(user: User) {
    const obj = user.toObject();
    delete obj.password;
    return obj;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const credentials = await this.credentialsModel
      .findOne({ userId })
      .select('+password');
    
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

    // Check if new password is same as current
    if (await credentials.comparePassword(newPassword)) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Update password
    credentials.password = newPassword;
    await credentials.save();

    this.logger.securityEvent('Password changed successfully', {
      userId: userId.toString(),
      timestamp: new Date().toISOString(),
    });

    return { message: 'Password changed successfully' };
  }

  async logout(userId: string): Promise<{ message: string }> {
    // Delete refresh token from Redis
    await this.redisService.del(`refresh_token:${userId}`);
    
    // Also clear from MongoDB for backward compatibility (optional)
    await this.credentialsModel.findOneAndUpdate(
      { userId },
      { $unset: { refreshToken: 1 } }
    );

    this.logger.log(`User logged out: ${userId}`, 'AuthService');
    return { message: 'Logged out successfully' };
  }
}
