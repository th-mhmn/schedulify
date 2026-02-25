import { Prisma, WorkingHours } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma.service';
import { Injectable } from '@nestjs/common';
import { WeekScheduleDto } from './dto/working-hours.dto';

@Injectable()
export class WorkingHoursService {
  constructor(private readonly prisma: PrismaService) {}

  async setWeeklySchedule(dto: WeekScheduleDto, businessId: number) {
    await this.prisma.workingHours.deleteMany({ where: { businessId } });
    const payload = {
      days: dto.days.map((d) => ({ ...d, businessId })),
    };
    return await this.prisma.workingHours.createManyAndReturn({
      data: payload.days,
    });
  }
}
