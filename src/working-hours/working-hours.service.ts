import { PrismaService } from '@/prisma.service';
import { Injectable } from '@nestjs/common';
import { WeekScheduleDto } from './dto/working-hours.dto';
import * as _ from 'lodash';

@Injectable()
export class WorkingHoursService {
  constructor(private readonly prisma: PrismaService) {}

  async setWeeklySchedule(dto: WeekScheduleDto, businessId: number) {
    await this.prisma.workingHours.deleteMany({ where: { businessId } });
    const payload = {
      days: dto.days.map((d) => ({ ...d, businessId })),
    };
    const weeklySchedule = await this.prisma.workingHours.createManyAndReturn({
      data: payload.days,
    });
    return _.sortBy(weeklySchedule, 'dayOfWeek');
  }

  async getWeeklySchedule(businessId: number) {
    const weeklySchedule = await this.prisma.workingHours.findMany({
      where: { businessId },
    });
    return _.sortBy(weeklySchedule, 'dayOfWeek');
  }
}
