import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DateTime } from 'luxon';

@Injectable()
export class BlocksOverlapService {
  constructor(private readonly prisma: PrismaService) {}
  async validate(businessId: number, start: DateTime, end: DateTime) {
    const blocksOverlap = Boolean(
      await this.prisma.availabilityBlock.findFirst({
        where: {
          businessId,
          endTime: { gt: start.toUTC().toJSDate() },
          startTime: { lt: end.toUTC().toJSDate() },
        },
      }),
    );
    if (blocksOverlap)
      throw new ConflictException('Blocks are overlapping on this time-span');

    const workingHours = await this.prisma.workingHours.findFirst({
      where: { businessId },
    });
    if (!workingHours) throw new NotFoundException('Working hours not found');

    const startMinute = start.hour * 60 + start.minute;
    const endMinute = end.hour * 60 + end.minute;

    if (
      startMinute < workingHours.startMinute ||
      endMinute > workingHours.endMinute
    )
      throw new BadRequestException('block timespan is outside working hours');
  }
}
