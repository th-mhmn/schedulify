import { timeToMinutes } from '@/_core/utils/time.utils';
import { Prisma } from '@/generated/prisma/browser';
import { PrismaService } from '@/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import * as _ from 'lodash';
import { WeekScheduleDto } from './dto/working-hours.dto';

@Injectable()
export class WorkingHoursService {
  constructor(private readonly prisma: PrismaService) {}

  async setWeeklySchedule(dto: WeekScheduleDto, businessId: number) {
    const res = await this.prisma.$transaction(
      async (tx) => {
        await tx.workingHours.deleteMany({ where: { businessId } });
        const payload = {
          days: dto.days.map((day) => {
            const { startTime, endTime, ...rest } = day;
            return {
              ...rest,
              businessId,
              startMinute: timeToMinutes(day.startTime),
              endMinute: timeToMinutes(day.endTime),
            };
          }),
        };
        const weeklySchedule = await tx.workingHours.createManyAndReturn({
          data: payload.days,
        });
        return _.sortBy(weeklySchedule, 'dayOfWeek');
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      },
    );
    return res;
  }

  async getWeeklySchedule(businessId: number) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) throw new NotFoundException('Business not found');

    const weeklySchedule = await this.prisma.workingHours.findMany({
      where: { businessId },
    });
    return _.sortBy(weeklySchedule, 'dayOfWeek');
  }
}
