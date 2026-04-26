import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { PrismaService } from '@/prisma.service';
import { DateTime } from 'luxon';
import { ServicesService } from '@/services/services.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly servicesService: ServicesService,
  ) {}

  async create(createBookingDto: CreateBookingDto, userId: number) {
    const { businessId, serviceId, startTime } = createBookingDto;

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    if (business.ownerId === userId)
      throw new ConflictException(
        'You cannot book a reservation for your own service',
      );

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service || service.businessId !== businessId)
      throw new NotFoundException('Service not found');

    const startDate = DateTime.fromISO(startTime).setZone(business.timezone);
    const endDate = startDate.plus({ minutes: service.durationMinutes });
    const dayOfWeek = startDate.weekday - 1;

    const workingHours = await this.prisma.workingHours.findFirst({
      where: {
        businessId,
        dayOfWeek,
      },
    });

    if (!workingHours)
      throw new ConflictException('Business is closed on this day');

    const { day, month, year } = startDate;
    const start_hour_minute = workingHours.startTime.split(':');
    const end_hour_minute = workingHours.endTime.split(':');

    const openAt = DateTime.fromObject({
      year,
      month,
      day,
      hour: Number(start_hour_minute[0]),
      minute: Number(start_hour_minute[1]),
    });

    const closeAt = DateTime.fromObject({
      year,
      month,
      day,
      hour: Number(end_hour_minute[0]),
      minute: Number(end_hour_minute[1]),
    });

    if (closeAt < endDate || openAt > startDate)
      throw new ConflictException('Outside working hours');

    const reserved = await this.servicesService.checkReserved(
      business?.timezone,
      startTime,
      service.durationMinutes,
    );

    if (!reserved) {
      const end = startDate.plus({ minutes: service.durationMinutes });

      const booking = await this.prisma.booking.create({
        data: {
          userId,
          businessId,
          serviceId,
          startTime: startDate.toJSDate(),
          endTime: end.toJSDate(),
        },
      });
      return { booking };
    }

    if (reserved.blocks.length > 0)
      throw new ConflictException(
        'The owner has blocked this time span for reservations',
      );

    throw new ConflictException(
      'There is another reservation already booked on this time',
    );
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
}
