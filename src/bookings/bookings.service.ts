import { Business, Prisma, Service } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import { NotificationQueue } from '../notifications/notification.queue';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingWindow } from './types/booking-window.type';
import { BookingAvailabilityService } from './validators/booking-conflict.validator';
import { BookingWorkingHoursValidator } from './validators/booking-working-hours.validator';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueue,
    private readonly workingHoursValidator: BookingWorkingHoursValidator,
    private readonly availabilityService: BookingAvailabilityService,
  ) {}

  async create(createBookingDto: CreateBookingDto, userId: number) {
    const { businessId, serviceId, startTime } = createBookingDto;

    const business = await this.validateBusiness(businessId, userId);
    const service = await this.validateService(serviceId, businessId);

    const bookingWindow = this.buildBookingWindow(startTime, service, business);

    const workingHours = await this.getWorkingHours(
      business,
      bookingWindow.dayOfWeek,
    );

    this.workingHoursValidator.validate(workingHours, bookingWindow);

    await this.availabilityService.validate(business, startTime, service);

    const booking = await this.createBookingRecord(
      bookingWindow,
      service,
      userId,
      businessId,
    );

    await this.notificationQueue.enqueueBookingCreated(booking.id);
    return { booking };
  }

  async findUserBookings(userId: number) {
    const bookings = await this.prisma.booking.findMany({ where: { userId } });
    return { bookings };
  }

  async findByBusinessId(businessId: number, date: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    const dayStart = DateTime.fromISO(date).setZone(business?.timezone);
    const dayEnd = dayStart.plus({ days: 1 });

    const bookings = await this.prisma.booking.findMany({
      where: {
        businessId,
        AND: {
          startTime: { gte: dayStart.toISO()! },
          endTime: { lte: dayEnd.toISO()! },
        },
      },
    });

    return { bookings };
  }

  findAll() {
    return `This action returns all bookings`;
  }

  findOne(id: number) {
    return `This action returns a #${id} booking`;
  }

  update(id: number, updateBookingDto: UpdateBookingDto) {
    return `This action updates a #${id} booking`;
  }

  remove(id: number) {
    return `This action removes a #${id} booking`;
  }

  private async validateBusiness(
    businessId: number,
    userId: number,
  ): Promise<Business> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    if (business.ownerId === userId)
      throw new ConflictException(
        'You cannot book a reservation for your own service',
      );
    return business;
  }

  private async validateService(
    serviceId: number,
    businessId: number,
  ): Promise<Service> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service || service.businessId !== businessId)
      throw new NotFoundException('Service not found');
    return service;
  }

  private async getWorkingHours(business: Business, dayOfWeek: number) {
    const { id: businessId } = business;

    const workingHours = await this.prisma.workingHours.findFirst({
      where: {
        businessId,
        dayOfWeek,
      },
    });
    if (!workingHours)
      throw new ConflictException('Business is closed on this day');
    return workingHours;
  }

  private buildBookingWindow(
    startTime: string,
    service: Service,
    business: Business,
  ): BookingWindow {
    const startDate = DateTime.fromISO(startTime).setZone(business.timezone);
    const endDate = startDate.plus({ minutes: service.durationMinutes });
    const dayOfWeek = startDate.weekday - 1;
    return { startDate, endDate, dayOfWeek };
  }

  private async createBookingRecord(
    bookingWindow: BookingWindow,
    service: Service,
    userId,
    businessId,
  ) {
    const { startDate, endDate } = bookingWindow;
    const { id: serviceId } = service;

    const booking = await this.prisma.$transaction(
      async (prisma) => {
        return await prisma.booking.create({
          data: {
            userId,
            businessId,
            serviceId,
            startTime: startDate.toJSDate(),
            endTime: endDate.toJSDate(),
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      },
    );
    return booking;
  }
}
