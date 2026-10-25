import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';
import { CampaignsService } from './campaigns.service';

@Controller('campaigns')
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Get()
  async findAll(@Query('city') city?: string) {
    return this.campaignsService.findAll(city);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async findMyCampaigns(@CurrentUser() user: User) {
    return this.campaignsService.findMyCampaigns(user.id);
  }

  @Get('my-codes')
  @UseGuards(JwtAuthGuard)
  async getMyCodes(@CurrentUser() user: User) {
    return this.campaignsService.getMyCodes(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: any, @CurrentUser() user: User) {
    return this.campaignsService.create(user.id, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updatePatch(@Param('id') id: string, @Body() body: any, @CurrentUser() user: User) {
    return this.campaignsService.update(id, user.id, user.role, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updatePut(@Param('id') id: string, @Body() body: any, @CurrentUser() user: User) {
    return this.campaignsService.update(id, user.id, user.role, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.campaignsService.delete(id, user.id, user.role);
  }

  @Post(':id/claim')
  @UseGuards(JwtAuthGuard)
  async claimCode(@Param('id') id: string, @CurrentUser() user: User) {
    return this.campaignsService.claimCode(id, user.id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(@Param('id') id: string, @CurrentUser() user: User) {
    return this.campaignsService.toggleLike(id, user.id);
  }

  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    return this.campaignsService.getComments(id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('id') id: string,
    @Body('text') text: string,
    @CurrentUser() user: User,
  ) {
    return this.campaignsService.addComment(id, user.id, text);
  }
}
