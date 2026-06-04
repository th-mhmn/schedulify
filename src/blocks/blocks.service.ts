import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AvailabilityBlockDto } from './dto/add-availability-block.dto';
import { PrismaService } from '@/prisma.service';
import { TimeRangeQueryDto } from '@/businesses/dto/time-range-query.dto';
import { Prisma } from '@/generated/prisma/client';

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: AvailabilityBlockDto, businessId: number) {
    const { startTime: dtoStartTime, endTime: dtoEndTime, reason } = dto;
    const startTimeUTC = new Date(dtoStartTime);
    const endTimeUTC = new Date(dtoEndTime);
    const blocksOverlap = Boolean(
      await this.prisma.availabilityBlock.findFirst({
        where: {
          businessId,
          endTime: { gt: startTimeUTC },
          startTime: { lt: endTimeUTC },
        },
      }),
    );
    if (blocksOverlap)
      throw new ConflictException('Blocks are overlapping on this time-span');
    return await this.prisma.$transaction(
      async (prisma) => {
        return await prisma.availabilityBlock.create({
          data: {
            startTime: startTimeUTC,
            endTime: endTimeUTC,
            reason,
            businessId,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      },
    );
  }

  async get(query?: TimeRangeQueryDto) {
    const blocks = await this.prisma.availabilityBlock.findMany({
      where: { startTime: { gte: query?.from }, endTime: { lte: query?.to } },
    });
    if (blocks.length === 0)
      throw new NotFoundException('No blocks found on this time period');
    return blocks;
  }

  async delete(id: number) {
    return await this.prisma.availabilityBlock.delete({ where: { id } });
  }
}
