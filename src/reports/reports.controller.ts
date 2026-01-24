import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { ModeratorGuard } from '../common/guards/moderator.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportStatus, ReportType, ReportPriority } from '../entities/report.entity';

@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createReportDto: CreateReportDto, @CurrentUser() user: User) {
    return this.reportsService.create(user._id.toString(), createReportDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async findAll(
    @Query('status') status?: ReportStatus,
    @Query('type') type?: ReportType,
    @Query('priority') priority?: ReportPriority,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    return this.reportsService.findAll(status, type, priority, page, limit);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async getStatistics() {
    return this.reportsService.getStatistics();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
    @CurrentUser() admin: User,
  ) {
    return this.reportsService.update(id, updateReportDto, admin._id.toString());
  }
}

