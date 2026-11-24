import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../entities/appointment.entity';
import { BusinessSchedule } from '../entities/business-schedule.entity';
import { Notification } from '../entities/notification.entity';
import { SalonServiceItem } from '../entities/salon-service.entity';
import { User } from '../entities/user.entity';
import { ModeratorGuard } from '../common/guards/moderator.guard';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalonServiceItem,
      BusinessSchedule,
      Appointment,
      User,
      Notification,
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, ModeratorGuard],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}

