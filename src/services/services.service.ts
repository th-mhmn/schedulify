import { extractHourMinute } from '@/_core/utils/time.utils';
import { Prisma } from '@/generated/prisma/browser';
import { AvailabilityBlock, Booking } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}
  async create(businessId: number, dto: CreateServiceDto) {
    const { durationMinutes, name, priceCents } = dto;
    const existingByName = await this.prisma.service.findFirst({
      where: { name, businessId },
    });
    if (existingByName)
      throw new BadRequestException(
        'A service already exists with the given name',
      );

    const service = await this.prisma.$transaction(
      async (prisma) => {
        return await prisma.service.create({
          data: {
            name,
            businessId,
            priceCents,
            durationMinutes,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      },
    );

    return { service };
  }

  async getAvailability(businessId: number, serviceId: number, date: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service || service.businessId !== businessId)
      throw new NotFoundException('Service not found');

    const businessZone = business.timezone;
    const dayStart = DateTime.fromISO(date, { zone: businessZone });
    if (!dayStart.isValid) throw new BadRequestException('Invalid date format');

    const dayOfWeek = dayStart.weekday - 1;
    const workingHours = await this.prisma.workingHours.findFirst({
      where: { businessId, dayOfWeek },
    });

    if (!workingHours) return { slots: [] };

    const { hour: startHour, minute: startMinute } = extractHourMinute(
      workingHours.startMinute,
    );
    const { hour: endHour, minute: endMinute } = extractHourMinute(
      workingHours.endMinute,
    );

    const openAt = DateTime.fromObject(
      {
        year: dayStart.year,
        month: dayStart.month,
        day: dayStart.day,
        hour: startHour,
        minute: startMinute,
      },
      { zone: businessZone },
    );

    const closeAt = DateTime.fromObject(
      {
        year: dayStart.year,
        month: dayStart.month,
        day: dayStart.day,
        hour: endHour,
        minute: endMinute,
      },
      { zone: businessZone },
    );

    const candidates = await this.generateCandidates(
      openAt,
      closeAt,
      service.durationMinutes,
    );
    const slots = candidates.map((c) => c.toUTC().toISO());

    return {
      slots,
    };
  }

  async findByBusinessId(businessId: number) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('business not found');

    const services = await this.prisma.service.findMany({
      where: { businessId },
    });
    return { services };
  }

  findAll() {
    return `This action returns all services`;
  }

  findOne(id: number) {
    return `This action returns a #${id} service`;
  }

  update(id: number, updateServiceDto: UpdateServiceDto) {
    return `This action updates a #${id} service`;
  }

  remove(id: number) {
    return `This action removes a #${id} service`;
  }

  private async generateCandidates(
    openAt: DateTime,
    closeAt: DateTime,
    durationMinutes: number,
  ): Promise<DateTime[]> {
    const latestStart = closeAt.minus({ minutes: durationMinutes });
    if (latestStart < openAt) return [];

    const overlaps = await this.getOverlaps(openAt, closeAt);
    const blocks = overlaps?.blocks ?? [];
    const bookings = overlaps?.bookings ?? [];

    const candidates: DateTime[] = [];
    let cursor = openAt;

    while (cursor <= latestStart) {
      const cursorEnd = cursor.plus({ minutes: durationMinutes });

      const isBlocked = blocks.some(
        (b) =>
          cursor.toJSDate() < b.endTime && cursorEnd.toJSDate() > b.startTime,
      );
      const isBooked = bookings.some(
        (b) =>
          cursor.toJSDate() < b.endTime && cursorEnd.toJSDate() > b.startTime,
      );

      if (!isBlocked && !isBooked) candidates.push(cursor);

      cursor = cursor.plus({ minutes: 5 });
    }

    return candidates;
  }

  async checkReserved(
    timezone: string,
    date: string,
    durationMinutes?: number,
  ) {
    const startDate = DateTime.fromISO(date, { zone: timezone });
    const endDate = startDate.plus(
      durationMinutes ? { minutes: durationMinutes } : { days: 1 },
    );

    return await this.getOverlaps(startDate, endDate);
  }

  private async getOverlaps(
    startDate: DateTime,
    endDate: DateTime,
  ): Promise<{ blocks: AvailabilityBlock[]; bookings: Booking[] } | null> {
    const [blocks, bookings] = await Promise.all([
      this.prisma.availabilityBlock.findMany({
        where: {
          startTime: { lt: endDate.toJSDate() },
          endTime: { gt: startDate.toJSDate() },
        },
      }),
      this.prisma.booking.findMany({
        where: {
          startTime: { lt: endDate.toJSDate() },
          endTime: { gt: startDate.toJSDate() },
          status: 'CONFIRMED',
        },
      }),
    ]);

    if (blocks.length === 0 && bookings.length === 0) return null;
    return { blocks, bookings };
  }
}
