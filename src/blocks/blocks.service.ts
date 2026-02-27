import { ConflictException, Injectable } from '@nestjs/common';
import { AvailabilityBlockDto } from './dto/add-availability-block.dto';
import { PrismaService } from '@/prisma.service';
import { TimeRangeQueryDto } from '@/businesses/dto/time-range-query.dto';

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: AvailabilityBlockDto, businessId: number) {
    const { startTime: dtoStartTime, endTime: dtoEndTime, reason } = dto;
    const startTimeUTC = new Date(dtoStartTime);
    const endTimeUTC = new Date(dtoEndTime);
    const blocksOverlap = Boolean(
      await this.prisma.availabilityBlock.findFirst({
        where: { endTime: { gt: startTimeUTC }, startTime: { lt: endTimeUTC } },
      }),
    );
    if (blocksOverlap)
      throw new ConflictException('Blocks are overlapping on this time-span');
    return await this.prisma.availabilityBlock.create({
      data: {
        startTime: startTimeUTC,
        endTime: endTimeUTC,
        reason,
        businessId,
      },
    });
  }

  async get(query?: TimeRangeQueryDto) {
    const blocks = await this.prisma.availabilityBlock.findMany({
      where: { startTime: { gte: query?.from }, endTime: { lte: query?.to } },
    });
    return blocks;
  }
}
