import {
  BadRequestException,
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

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service || service.businessId !== businessId)
      throw new NotFoundException('Service not found');

    const startDate = DateTime.fromISO(startTime).setZone(business.timezone);
    const dayOfWeek = startDate.weekday - 1;

    const workingHours = await this.prisma.workingHours.findMany({
      where: { businessId, dayOfWeek },
    });
    if (workingHours.length === 0)
      throw new BadRequestException('Business is closed on this time');

    const reserved = await this.servicesService.checkReserved(
      business?.timezone,
      startTime,
      service.durationMinutes,
    );

    if (reserved)
      throw new BadRequestException(
        'You cannot book a reservation on this time',
      );

    const end = startDate.plus({ minutes: service.durationMinutes });

    const booking = await this.prisma.booking.create({
      data: {
        userId,
        businessId,
        serviceId,
        startTime: startDate.toISO()!,
        endTime: end.toISO()!,
      },
    });
    return booking;
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
