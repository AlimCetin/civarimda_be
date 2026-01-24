import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ModeratorGuard } from '../common/guards/moderator.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';
import { AdminService } from './admin.service';
import { BanUserDto } from './dto/ban-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { ActivityType } from '../entities/activity-log.entity';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async getDashboard() {
    return this.adminService.getDashboardStatistics();
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isBanned') isBanned?: string,
  ) {
    const isBannedBool = isBanned === 'true' ? true : isBanned === 'false' ? false : undefined;
    return this.adminService.getUsers(page, limit, search, role, isBannedBool);
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Post('users/:id/ban')
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async banUser(
    @Param('id') id: string,
    @Body() banUserDto: BanUserDto,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.banUser(id, admin._id.toString(), banUserDto);
  }

  @Post('users/:id/unban')
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async unbanUser(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.adminService.unbanUser(id, admin._id.toString());
  }

  @Post('users/:id/warn')
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async warnUser(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() admin: User,
  ) {
    return this.adminService.warnUser(id, admin._id.toString(), body.reason);
  }

  @Put('users/:id/role')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async changeUserRole(
    @Param('id') id: string,
    @Body() changeRoleDto: ChangeRoleDto,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.changeUserRole(id, admin._id.toString(), changeRoleDto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async deletePost(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() admin: User,
  ) {
    return this.adminService.deletePost(id, admin._id.toString(), body.reason);
  }

  @Get('activity-logs')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getActivityLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    @Query('adminId') adminId?: string,
    @Query('activityType') activityType?: ActivityType,
  ) {
    return this.adminService.getActivityLogs(page, limit, adminId, activityType);
  }
}

