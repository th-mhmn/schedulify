import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as _ from 'lodash';
import { DateTime } from 'luxon';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from '@/prisma.service';
import { AvailabilityBlock, Booking } from '@/generated/prisma/client';
import { formatDateToHour } from '@/_core/utils/date';
import { formatDateToHour } from './../_core/utils/date';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}
  async create(businessId: number, dto: CreateServiceDto) {
    const { durationMinutes, name, priceCents } = dto;
    const existingByName = await this.prisma.service.findFirst({
      where: { name },
    });
    if (existingByName)
      throw new BadRequestException(
        'A service already exists with the given name',
      );

    const service = await this.prisma.service.create({
      data: {
        name,
        businessId,
        priceCents,
        durationMinutes,
      },
    });

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

    const dayStart = DateTime.fromISO(date);
    const dayOfWeek = dayStart.weekday - 1;
    const workingHours = await this.prisma.workingHours.findFirst({
      where: { businessId, dayOfWeek },
    });

    if (!workingHours) return { workingHours: [] };

    const start_hour_minute = workingHours.startTime.split(':');
    const end_hour_minute = workingHours.endTime.split(':');

    const { day, month, year } = dayStart;

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

    const candidates = await this.generateCandidates(
      openAt,
      closeAt,
      service.durationMinutes,
    );

    const formattedCandidates = candidates.map((c) =>
      formatDateToHour(c.setZone(business.timezone)),
    );

    const reserved = await this.checkReserved(business.timezone, date);
    return { workingHours, reserved, candidates: formattedCandidates };
  }

  async findByBusinessId(businessId: number) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

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
  ) {
    let candidates: DateTime<boolean>[] = [];
    const latestStart = closeAt.minus({ minutes: durationMinutes });
    if (latestStart < openAt) return candidates;

    let indexDateTime = openAt;
    const diff = closeAt.diff(openAt, 'minutes').toObject().minutes!;

    for (let i = 0; i < diff; i += 5) {
      const indexDateEnd = indexDateTime.plus({ minutes: durationMinutes });
      const isReserved = await this.getOverlaps(indexDateTime, indexDateEnd);
      if (!isReserved) candidates.push(indexDateTime);
      indexDateTime = indexDateTime.plus({ minutes: 5 });
    }

    const sortedCandidates = _.sortBy(candidates, [
      (c) => c.get('hour'),
      (c) => c.get('minute'),
    ]);

    return sortedCandidates;
  }

  async checkReserved(
    timezone: string,
    startISO: string,
    durationMinutes?: number,
  ) {
    const startDate = DateTime.fromISO(startISO!).setZone(timezone);
    const endDate = startDate.plus(
      durationMinutes ? { minutes: durationMinutes } : { days: 1 },
    );

    return await this.getOverlaps(startDate, endDate);
  }

  private async getOverlaps(
    startDate: DateTime,
    endDate: DateTime,
  ): Promise<{ blocks: AvailabilityBlock[]; bookings: Booking[] } | null> {
    const blocks = await this.prisma.availabilityBlock.findMany({
      where: {
        AND: {
          startTime: { lt: endDate.toJSDate() },
          endTime: { gt: startDate.toJSDate() },
        },
      },
    });

    const bookings = await this.prisma.booking.findMany({
      where: {
        AND: {
          startTime: { lt: endDate.toJSDate() },
          endTime: { gt: startDate.toJSDate() },
        },
        status: 'CONFIRMED',
      },
    });

    if (blocks.length === 0 && bookings.length === 0) return null;

    return { blocks, bookings };
  }
}
