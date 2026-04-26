import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from '@/prisma.service';
import { DateTime } from 'luxon';
import { AvailabilityBlock, Booking } from '@/generated/prisma/client';

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

    const dayStart = DateTime.fromISO(date).setZone(business.timezone);
    const dayOfWeek = dayStart.weekday - 1;
    const workingHours = await this.prisma.workingHours.findMany({
      where: { businessId, dayOfWeek },
    });
    if (workingHours.length === 0) return { workingHours };
    const reserved = await this.checkReserved(business.timezone, date);
    return { workingHours, reserved };
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

  async checkReserved(
    timezone: string,
    start: string,
    durationMinutes?: number,
  ): Promise<{ blocks: AvailabilityBlock[]; bookings: Booking[] } | null> {
    const startDate = DateTime.fromISO(start).setZone(timezone);
    const endDate = startDate.plus(
      durationMinutes ? { minutes: durationMinutes } : { days: 1 },
    );

    const blocks = await this.prisma.availabilityBlock.findMany({
      where: {
        startTime: { lte: endDate.toISO()! },
        endTime: { gte: startDate.toISO()! },
      },
    });

    const bookings = await this.prisma.booking.findMany({
      where: {
        startTime: { lte: endDate.toISO()! },
        endTime: { gte: startDate.toISO()! },
        status: 'CONFIRMED',
      },
    });

    if (blocks.length === 0 && bookings.length === 0) return null;
    return { blocks: blocks, bookings };
  }
}
