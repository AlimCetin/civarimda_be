import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from '../entities/user.entity';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        user: any;
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: any;
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    getMe(user: User): Promise<User>;
    changePassword(dto: ChangePasswordDto, user: User): Promise<{
        message: string;
    }>;
    logout(user: User): Promise<{
        message: string;
    }>;
}
