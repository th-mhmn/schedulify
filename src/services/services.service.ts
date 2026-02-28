import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from '@/prisma.service';
import { DateTime } from 'luxon';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}
  async create(businessId: number, dto: CreateServiceDto) {
    const { durationMinutes, name, priceCents } = dto;
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
    const dayEnd = dayStart.plus({ days: 1 });
    const dayOfWeek = dayStart.weekday - 1;
    const workingHours = await this.prisma.workingHours.findMany({
      where: { businessId, dayOfWeek },
    });
    const blocks = await this.prisma.availabilityBlock.findMany({
      where: {
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
    });

    return workingHours;
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
}
