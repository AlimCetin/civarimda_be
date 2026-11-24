import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { BusinessSchedule } from '../entities/business-schedule.entity';
import { Notification } from '../entities/notification.entity';
import { SalonServiceItem } from '../entities/salon-service.entity';
import { User } from '../entities/user.entity';
import {
  CreateAppointmentDto,
  CreateSalonServiceDto,
  UpdateAppointmentStatusDto,
  UpdateSalonServiceDto,
  UpsertScheduleDto,
} from './dto/appointment.dto';

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(SalonServiceItem)
    private readonly serviceRepo: Repository<SalonServiceItem>,
    @InjectRepository(BusinessSchedule)
    private readonly scheduleRepo: Repository<BusinessSchedule>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly dataSource: DataSource,
  ) {}

  private async assertBusinessOwner(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user || !user.isBusiness || !user.businessName) {
      throw new ForbiddenException(
        'Bu işlemi yapmak için önce işletme profilinizi tamamlamalısınız.',
      );
    }
    return user;
  }

  /**
   * Müşterilerin randevu alabileceği aktif işletmeleri (kuaför/berber vb.) listeler.
   */
  async listBusinesses(city?: string, category?: string) {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .where('u.isBusiness = true')
      .andWhere('u.deletedAt IS NULL')
      .andWhere('u.isPermanentlyBanned = false');

    if (city && city.trim()) {
      const cleanCity = city.split('-')[0].trim();
      qb.andWhere('(u.businessCity ILIKE :city OR u.businessCity ILIKE :cleanCity)', {
        city: `%${city.trim()}%`,
        cleanCity: `%${cleanCity}%`,
      });
    }

    if (category && category.trim()) {
      qb.andWhere('u.businessCategory ILIKE :category', {
        category: `%${category.trim()}%`,
      });
    }

    const businesses = await qb.orderBy('u.businessVerified', 'DESC').addOrderBy('u.createdAt', 'DESC').getMany();
    const ids = businesses.map((b) => b.id);
    const services = ids.length > 0
      ? await this.serviceRepo.find({ where: { businessUserId: In(ids), isActive: true } })
      : [];

    const serviceCountMap = new Map<string, number>();
    for (const svc of services) {
      serviceCountMap.set(svc.businessUserId, (serviceCountMap.get(svc.businessUserId) || 0) + 1);
    }

    return businesses.map((b) => ({
      id: b.id,
      businessName: b.businessName,
      businessCategory: b.businessCategory,
      businessCity: b.businessCity,
      businessPhone: b.businessPhone,
      businessAddress: b.businessAddress,
      businessVerified: b.businessVerified,
      avatar: b.avatar,
      activeServiceCount: serviceCountMap.get(b.id) || 0,
    }));
  }

  // --- HİZMET YÖNETİMİ ---
  async getBusinessServices(businessUserId: string, includeInactive = false) {
    const where = includeInactive
      ? { businessUserId }
      : { businessUserId, isActive: true };
    return this.serviceRepo.find({ where, order: { price: 'ASC', createdAt: 'ASC' } });
  }

  async createService(userId: string, dto: CreateSalonServiceDto) {
    await this.assertBusinessOwner(userId);
    const item = this.serviceRepo.create({
      businessUserId: userId,
      name: dto.name.trim(),
      description: dto.description?.trim() || '',
      durationMinutes: dto.durationMinutes,
      price: dto.price,
      isActive: dto.isActive ?? true,
    });
    return this.serviceRepo.save(item);
  }

  async updateService(userId: string, serviceId: string, dto: UpdateSalonServiceDto) {
    const item = await this.serviceRepo.findOne({ where: { id: serviceId } });
    if (!item) throw new NotFoundException('Hizmet bulunamadı.');
    if (item.businessUserId !== userId) {
      throw new ForbiddenException('Bu hizmeti düzenleme yetkiniz yok.');
    }

    if (dto.name !== undefined) item.name = dto.name.trim();
    if (dto.description !== undefined) item.description = dto.description.trim();
    if (dto.durationMinutes !== undefined) item.durationMinutes = dto.durationMinutes;
    if (dto.price !== undefined) item.price = dto.price;
    if (dto.isActive !== undefined) item.isActive = dto.isActive;

    return this.serviceRepo.save(item);
  }

  async deleteService(userId: string, serviceId: string) {
    const item = await this.serviceRepo.findOne({ where: { id: serviceId } });
    if (!item) throw new NotFoundException('Hizmet bulunamadı.');
    if (item.businessUserId !== userId) {
      throw new ForbiddenException('Bu hizmeti silme yetkiniz yok.');
    }
    await this.serviceRepo.delete(serviceId);
    return { success: true };
  }

  // --- ÇALIŞMA SAATLERİ ---
  async getBusinessSchedule(businessUserId: string) {
    const saved = await this.scheduleRepo.find({
      where: { businessUserId },
      order: { dayOfWeek: 'ASC' },
    });
    const byDay = new Map(saved.map((s) => [s.dayOfWeek, s]));

    return Array.from({ length: 7 }, (_, day) => {
      const existing = byDay.get(day);
      if (existing) return existing;
      return {
        businessUserId,
        dayOfWeek: day,
        isOpen: day !== 0, // Varsayılan: Pazar kapalı, Pzt-Cmt açık
        openTime: '09:00',
        closeTime: '20:00',
        breakStart: '12:30',
        breakEnd: '13:30',
        slotIntervalMinutes: 30,
      };
    });
  }

  async upsertSchedule(userId: string, dto: UpsertScheduleDto) {
    await this.assertBusinessOwner(userId);
    for (const day of dto.days) {
      if (day.isOpen && timeToMinutes(day.closeTime) <= timeToMinutes(day.openTime)) {
        throw new BadRequestException('Kapanış saati açılış saatinden sonra olmalıdır.');
      }
      const existing = await this.scheduleRepo.findOne({
        where: { businessUserId: userId, dayOfWeek: day.dayOfWeek },
      });
      if (existing) {
        existing.isOpen = day.isOpen;
        existing.openTime = day.openTime;
        existing.closeTime = day.closeTime;
        existing.breakStart = day.breakStart ?? null;
        existing.breakEnd = day.breakEnd ?? null;
        existing.slotIntervalMinutes = day.slotIntervalMinutes ?? 30;
        await this.scheduleRepo.save(existing);
      } else {
        await this.scheduleRepo.save(
          this.scheduleRepo.create({
            businessUserId: userId,
            dayOfWeek: day.dayOfWeek,
            isOpen: day.isOpen,
            openTime: day.openTime,
            closeTime: day.closeTime,
            breakStart: day.breakStart ?? null,
            breakEnd: day.breakEnd ?? null,
            slotIntervalMinutes: day.slotIntervalMinutes ?? 30,
          }),
        );
      }
    }
    return this.getBusinessSchedule(userId);
  }

  // --- MÜSAİT SAAT HESAPLAMA ---
  async getAvailableSlots(businessUserId: string, dateStr: string, serviceId: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new BadRequestException('Tarih YYYY-AA-GG formatında olmalıdır.');
    }

    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, businessUserId, isActive: true },
    });
    if (!service) {
      throw new NotFoundException('Seçilen hizmet bulunamadı.');
    }

    const parsedDate = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Geçersiz tarih.');
    }

    const dayOfWeek = parsedDate.getDay();
    const fullSchedule = await this.getBusinessSchedule(businessUserId);
    const daySchedule = fullSchedule.find((d) => d.dayOfWeek === dayOfWeek);

    if (!daySchedule || !daySchedule.isOpen) {
      return { date: dateStr, isOpen: false, slots: [] as string[] };
    }

    const openMin = timeToMinutes(daySchedule.openTime);
    const closeMin = timeToMinutes(daySchedule.closeTime);
    const breakStartMin = daySchedule.breakStart ? timeToMinutes(daySchedule.breakStart) : null;
    const breakEndMin = daySchedule.breakEnd ? timeToMinutes(daySchedule.breakEnd) : null;
    const step = daySchedule.slotIntervalMinutes || 30;
    const duration = service.durationMinutes;

    const existing = await this.appointmentRepo.find({
      where: {
        businessUserId,
        appointmentDate: dateStr,
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
    });

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentNowMin = now.getHours() * 60 + now.getMinutes();

    const slots: string[] = [];
    for (let start = openMin; start + duration <= closeMin; start += step) {
      const end = start + duration;

      // Bugün için geçmiş saatleri ele
      if (dateStr === todayStr && start <= currentNowMin + 15) {
        continue;
      }

      // Mola aralığı ile çakışma kontrolü
      if (
        breakStartMin !== null &&
        breakEndMin !== null &&
        start < breakEndMin &&
        end > breakStartMin
      ) {
        continue;
      }

      // Mevcut randevularla çakışma kontrolü
      const hasConflict = existing.some((appt) => {
        const apptStart = timeToMinutes(appt.startTime);
        const apptEnd = timeToMinutes(appt.endTime);
        return start < apptEnd && end > apptStart;
      });

      if (!hasConflict) {
        slots.push(minutesToTime(start));
      }
    }

    return { date: dateStr, isOpen: true, slots };
  }

  // --- RANDEVU OLUŞTURMA (ÇAKIŞMA KİLİTLİ) ---
  async createAppointment(customerId: string, dto: CreateAppointmentDto) {
    if (customerId === dto.businessUserId) {
      throw new BadRequestException('Kendi işletmenize randevu oluşturamazsınız.');
    }

    const service = await this.serviceRepo.findOne({
      where: { id: dto.serviceId, businessUserId: dto.businessUserId, isActive: true },
    });
    if (!service) {
      throw new NotFoundException('Seçilen hizmet bulunamadı veya aktif değil.');
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (dto.appointmentDate < todayStr) {
      throw new BadRequestException('Geçmiş bir tarihe randevu alınamaz.');
    }

    const startMin = timeToMinutes(dto.startTime);
    const endMin = startMin + service.durationMinutes;
    const endTime = minutesToTime(endMin);

    // Çalışma saati kontrolü
    const availability = await this.getAvailableSlots(
      dto.businessUserId,
      dto.appointmentDate,
      dto.serviceId,
    );
    if (!availability.isOpen || !availability.slots.includes(dto.startTime)) {
      throw new ConflictException('Seçilen saat dilimi müsait değil. Lütfen başka bir saat seçin.');
    }

    return this.dataSource.transaction(async (manager) => {
      // Eşzamanlı çift randevuyu engellemek için aynı günün randevularını kilitle
      const sameDayAppointments = await manager.find(Appointment, {
        where: {
          businessUserId: dto.businessUserId,
          appointmentDate: dto.appointmentDate,
          status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
        },
        lock: { mode: 'pessimistic_write' },
      });

      const conflict = sameDayAppointments.some((appt) => {
        const apptStart = timeToMinutes(appt.startTime);
        const apptEnd = timeToMinutes(appt.endTime);
        return startMin < apptEnd && endMin > apptStart;
      });

      if (conflict) {
        throw new ConflictException('Bu saat az önce başka bir müşteri tarafından alındı.');
      }

      const appointment = manager.create(Appointment, {
        businessUserId: dto.businessUserId,
        customerId,
        serviceId: service.id,
        serviceName: service.name,
        durationMinutes: service.durationMinutes,
        price: Number(service.price),
        appointmentDate: dto.appointmentDate,
        startTime: dto.startTime,
        endTime,
        status: AppointmentStatus.PENDING,
        requestedTreatment: dto.requestedTreatment?.trim() || '',
        customerNote: dto.customerNote?.trim() || '',
      });

      const saved = await manager.save(Appointment, appointment);

      await manager.save(
        Notification,
        manager.create(Notification, {
          userId: dto.businessUserId,
          fromUserId: customerId,
          type: 'appointment',
        }),
      );

      return saved;
    });
  }

  private async enrichAppointments(items: Appointment[]) {
    const userIds = Array.from(
      new Set(items.flatMap((i) => [i.businessUserId, i.customerId])),
    );
    const users = userIds.length > 0
      ? await this.userRepo.find({
          where: { id: In(userIds) },
          select: ['id', 'fullName', 'avatar', 'businessName', 'businessCity', 'businessPhone'],
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return items.map((item) => {
      const biz = userMap.get(item.businessUserId);
      const cust = userMap.get(item.customerId);
      return {
        ...item,
        price: Number(item.price),
        business: biz
          ? {
              id: biz.id,
              businessName: biz.businessName || biz.fullName,
              businessCity: biz.businessCity,
              businessPhone: biz.businessPhone,
              avatar: biz.avatar,
            }
          : null,
        customer: cust
          ? {
              id: cust.id,
              fullName: cust.fullName,
              avatar: cust.avatar,
            }
          : null,
      };
    });
  }

  async getMyAppointments(customerId: string) {
    const items = await this.appointmentRepo.find({
      where: { customerId },
      order: { appointmentDate: 'DESC', startTime: 'DESC' },
    });
    return this.enrichAppointments(items);
  }

  async getBusinessAppointments(businessUserId: string, status?: AppointmentStatus, date?: string) {
    await this.assertBusinessOwner(businessUserId);
    const qb = this.appointmentRepo
      .createQueryBuilder('a')
      .where('a.businessUserId = :businessUserId', { businessUserId });

    if (status) qb.andWhere('a.status = :status', { status });
    if (date) qb.andWhere('a.appointmentDate = :date', { date });

    const items = await qb
      .orderBy('a.appointmentDate', 'ASC')
      .addOrderBy('a.startTime', 'ASC')
      .getMany();
    return this.enrichAppointments(items);
  }

  async updateAppointmentStatus(
    actorId: string,
    actorRole: string,
    appointmentId: string,
    dto: UpdateAppointmentStatusDto,
  ) {
    const appt = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
    if (!appt) {
      throw new NotFoundException('Randevu bulunamadı.');
    }

    const isAdminOrMod = ['admin', 'super_admin', 'moderator'].includes(actorRole);
    const isBusinessOwner = appt.businessUserId === actorId;
    const isCustomer = appt.customerId === actorId;

    if (!isAdminOrMod && !isBusinessOwner && !isCustomer) {
      throw new ForbiddenException('Bu randevuyu güncelleme yetkiniz yok.');
    }

    if (isCustomer && !isBusinessOwner && !isAdminOrMod) {
      if (dto.status !== AppointmentStatus.CANCELLED) {
        throw new ForbiddenException('Müşteriler yalnızca kendi randevusunu iptal edebilir.');
      }
      if (
        appt.status !== AppointmentStatus.PENDING &&
        appt.status !== AppointmentStatus.CONFIRMED
      ) {
        throw new BadRequestException('Yalnızca bekleyen veya onaylı randevular iptal edilebilir.');
      }
    }

    appt.status = dto.status;
    if (dto.businessNote !== undefined && (isBusinessOwner || isAdminOrMod)) {
      appt.businessNote = dto.businessNote.trim();
    }
    if (dto.status === AppointmentStatus.CANCELLED) {
      appt.cancelledBy = actorId;
      appt.cancelReason = dto.cancelReason?.trim() || null;
    }

    const saved = await this.appointmentRepo.save(appt);

    // Karşı tarafa bildirim oluştur
    const targetUserId = isCustomer ? appt.businessUserId : appt.customerId;
    await this.notificationRepo.save(
      this.notificationRepo.create({
        userId: targetUserId,
        fromUserId: actorId,
        type: 'appointment',
      }),
    );

    return saved;
  }

  // --- ADMIN YÖNETİMİ ---
  async getAdminAppointments(params: {
    status?: AppointmentStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(params.page || 1, 1);
    const limit = Math.min(Math.max(params.limit || 25, 1), 100);
    const skip = (page - 1) * limit;

    const qb = this.appointmentRepo.createQueryBuilder('a');
    if (params.status) {
      qb.andWhere('a.status = :status', { status: params.status });
    }
    if (params.search && params.search.trim()) {
      qb.andWhere('(a.serviceName ILIKE :q OR a.appointmentDate ILIKE :q)', {
        q: `%${params.search.trim()}%`,
      });
    }

    const [rawItems, total] = await qb
      .orderBy('a.appointmentDate', 'DESC')
      .addOrderBy('a.startTime', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const [items, pendingCount, confirmedCount, completedCount, cancelledCount] = await Promise.all([
      this.enrichAppointments(rawItems),
      this.appointmentRepo.count({ where: { status: AppointmentStatus.PENDING } }),
      this.appointmentRepo.count({ where: { status: AppointmentStatus.CONFIRMED } }),
      this.appointmentRepo.count({ where: { status: AppointmentStatus.COMPLETED } }),
      this.appointmentRepo.count({
        where: { status: In([AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]) },
      }),
    ]);

    return {
      items,
      stats: {
        total: pendingCount + confirmedCount + completedCount + cancelledCount,
        pendingCount,
        confirmedCount,
        completedCount,
        cancelledCount,
      },
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + rawItems.length < total,
      },
    };
  }

  /**
   * İşletme veya platform geneli için aylık özet ve müşteri bazlı randevu analitiği üretir:
   * - Aylık tekil müşteri sayısı, sadık müşteri sayısı, gelen/iptal/gelmedi sayıları ve ciro
   * - Müşteri bazında kaç kere geldiği, kaç randevu iptal ettiği ve toplam harcaması
   */
  async getCustomerAnalytics(params: {
    businessUserId?: string;
    month?: string;
    requireBusinessOwner?: boolean;
  }) {
    if (params.requireBusinessOwner && params.businessUserId) {
      await this.assertBusinessOwner(params.businessUserId);
    }

    const targetMonth =
      params.month && /^\d{4}-\d{2}$/.test(params.month)
        ? params.month
        : new Date().toISOString().slice(0, 7);

    const qb = this.appointmentRepo.createQueryBuilder('a');
    if (params.businessUserId) {
      qb.where('a.businessUserId = :businessUserId', {
        businessUserId: params.businessUserId,
      });
    }

    const allAppointments = await qb.orderBy('a.appointmentDate', 'DESC').getMany();

    const monthlyAppointments = allAppointments.filter((a) =>
      a.appointmentDate.startsWith(targetMonth),
    );

    const monthlyCustomers = new Set(monthlyAppointments.map((a) => a.customerId));
    const monthlyVisitCounts = new Map<string, number>();
    let monthlyCompleted = 0;
    let monthlyCancelled = 0;
    let monthlyNoShow = 0;
    let monthlyRevenue = 0;

    for (const appt of monthlyAppointments) {
      if (appt.status === AppointmentStatus.COMPLETED) {
        monthlyCompleted++;
        monthlyRevenue += Number(appt.price) || 0;
        monthlyVisitCounts.set(
          appt.customerId,
          (monthlyVisitCounts.get(appt.customerId) || 0) + 1,
        );
      } else if (appt.status === AppointmentStatus.CANCELLED) {
        monthlyCancelled++;
      } else if (appt.status === AppointmentStatus.NO_SHOW) {
        monthlyNoShow++;
      }
    }

    // Müşteri bazında tüm zamanların sadakat ve iptal metrikleri
    const customerStatsMap = new Map<
      string,
      {
        customerId: string;
        totalBookings: number;
        completedVisits: number;
        cancelledCount: number;
        noShowCount: number;
        totalSpent: number;
        lastVisitDate: string;
      }
    >();

    for (const appt of allAppointments) {
      const existing = customerStatsMap.get(appt.customerId) || {
        customerId: appt.customerId,
        totalBookings: 0,
        completedVisits: 0,
        cancelledCount: 0,
        noShowCount: 0,
        totalSpent: 0,
        lastVisitDate: appt.appointmentDate,
      };

      existing.totalBookings++;
      if (appt.status === AppointmentStatus.COMPLETED) {
        existing.completedVisits++;
        existing.totalSpent += Number(appt.price) || 0;
      } else if (appt.status === AppointmentStatus.CANCELLED) {
        existing.cancelledCount++;
      } else if (appt.status === AppointmentStatus.NO_SHOW) {
        existing.noShowCount++;
      }

      if (appt.appointmentDate > existing.lastVisitDate) {
        existing.lastVisitDate = appt.appointmentDate;
      }

      customerStatsMap.set(appt.customerId, existing);
    }

    const customerIds = Array.from(customerStatsMap.keys());
    const users =
      customerIds.length > 0
        ? await this.userRepo.find({
            where: { id: In(customerIds) },
            select: ['id', 'fullName', 'avatar'],
          })
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const customers = Array.from(customerStatsMap.values())
      .map((stat) => {
        const u = userMap.get(stat.customerId);
        return {
          ...stat,
          fullName: u?.fullName || 'Müşteri',
          avatar: u?.avatar || null,
        };
      })
      .sort((a, b) => b.completedVisits - a.completedVisits || b.totalBookings - a.totalBookings);

    const repeatCustomerCount = customers.filter((c) => c.completedVisits >= 2).length;

    return {
      monthlySummary: {
        month: targetMonth,
        totalAppointments: monthlyAppointments.length,
        uniqueCustomers: monthlyCustomers.size,
        completedCount: monthlyCompleted,
        cancelledCount: monthlyCancelled,
        noShowCount: monthlyNoShow,
        totalRevenue: monthlyRevenue,
        repeatCustomerCount,
      },
      customers,
    };
  }
}

