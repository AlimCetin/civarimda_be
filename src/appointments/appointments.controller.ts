import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { ModeratorGuard } from '../common/guards/moderator.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';
import { AppointmentStatus } from '../entities/appointment.entity';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  CreateSalonServiceDto,
  UpdateAppointmentStatusDto,
  UpdateSalonServiceDto,
  UpsertScheduleDto,
} from './dto/appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // --- HERKESE AÇIK İŞLETME / HİZMET / MÜSAİTLİK SORGULARI ---
  @Get('businesses')
  async listBusinesses(
    @Query('city') city?: string,
    @Query('category') category?: string,
  ) {
    return this.appointmentsService.listBusinesses(city, category);
  }

  @Get('businesses/:businessId/services')
  async getBusinessServices(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.appointmentsService.getBusinessServices(businessId, false);
  }

  @Get('businesses/:businessId/schedule')
  async getBusinessSchedule(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.appointmentsService.getBusinessSchedule(businessUserIdOrThrow(businessId));
  }

  @Get('businesses/:businessId/slots')
  async getAvailableSlots(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Query('date') date: string,
    @Query('serviceId', ParseUUIDPipe) serviceId: string,
  ) {
    return this.appointmentsService.getAvailableSlots(businessId, date, serviceId);
  }

  // --- İŞLETME SAHİBİ HİZMET & ÇALIŞMA SAATİ YÖNETİMİ ---
  @Get('my-services')
  @UseGuards(JwtAuthGuard)
  async getMyServices(@CurrentUser() user: User) {
    return this.appointmentsService.getBusinessServices(user.id, true);
  }

  @Post('services')
  @UseGuards(JwtAuthGuard)
  async createService(@Body() dto: CreateSalonServiceDto, @CurrentUser() user: User) {
    return this.appointmentsService.createService(user.id, dto);
  }

  @Put('services/:serviceId')
  @UseGuards(JwtAuthGuard)
  async updateService(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() dto: UpdateSalonServiceDto,
    @CurrentUser() user: User,
  ) {
    return this.appointmentsService.updateService(user.id, serviceId, dto);
  }

  @Delete('services/:serviceId')
  @UseGuards(JwtAuthGuard)
  async deleteService(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @CurrentUser() user: User,
  ) {
    return this.appointmentsService.deleteService(user.id, serviceId);
  }

  @Put('schedule')
  @UseGuards(JwtAuthGuard)
  async upsertSchedule(@Body() dto: UpsertScheduleDto, @CurrentUser() user: User) {
    return this.appointmentsService.upsertSchedule(user.id, dto);
  }

  // --- RANDEVU İŞLEMLERİ (MÜŞTERİ & İŞLETME) ---
  @Post()
  @UseGuards(JwtAuthGuard)
  async createAppointment(@Body() dto: CreateAppointmentDto, @CurrentUser() user: User) {
    return this.appointmentsService.createAppointment(user.id, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyAppointments(@CurrentUser() user: User) {
    return this.appointmentsService.getMyAppointments(user.id);
  }

  @Get('business')
  @UseGuards(JwtAuthGuard)
  async getBusinessAppointments(
    @CurrentUser() user: User,
    @Query('status') status?: AppointmentStatus,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.getBusinessAppointments(user.id, status, date);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.appointmentsService.updateAppointmentStatus(user.id, user.role, id, dto);
  }

  // --- ANALİTİK (İŞLETME & ADMIN) ---
  @Get('analytics/business')
  @UseGuards(JwtAuthGuard)
  async getMyBusinessAnalytics(
    @CurrentUser() user: User,
    @Query('month') month?: string,
  ) {
    return this.appointmentsService.getCustomerAnalytics({
      businessUserId: user.id,
      month,
      requireBusinessOwner: true,
    });
  }

  @Get('analytics/admin')
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async getAdminAnalytics(
    @Query('month') month?: string,
    @Query('businessId') businessId?: string,
  ) {
    return this.appointmentsService.getCustomerAnalytics({
      businessUserId: businessId,
      month,
      requireBusinessOwner: false,
    });
  }

  // --- ADMIN / MODERATÖR RANDEVU YÖNETİMİ ---
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, ModeratorGuard)
  async getAdminAppointments(
    @Query('status') status?: AppointmentStatus,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number = 25,
  ) {
    return this.appointmentsService.getAdminAppointments({ status, search, page, limit });
  }
}

function businessUserIdOrThrow(id: string): string {
  return id;
}

