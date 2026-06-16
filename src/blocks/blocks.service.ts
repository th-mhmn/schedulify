import { TimeRangeQueryDto } from '@/businesses/dto/time-range-query.dto';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AvailabilityBlockDto } from './dto/add-availability-block.dto';
import { BlocksOverlapService } from './validators/blocks-overlap.validator';

@Injectable()
export class BlocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blocksOverlap: BlocksOverlapService,
  ) {}

  async create(dto: AvailabilityBlockDto, businessId: number) {
    const { startTime, endTime, reason } = dto;

    const date = this.convertStringToDate(startTime, endTime);

    await this.blocksOverlap.validate(businessId, date.start, date.end);

    const block = await this.createBlockRecord(
      businessId,
      date.start,
      date.end,
      reason,
    );
    return { block };
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

  private async createBlockRecord(
    businessId: number,
    startTime: Date,
    endTime: Date,
    reason: string,
  ) {
    await this.prisma.$transaction(
      async (prisma) => {
        return await prisma.availabilityBlock.create({
          data: {
            startTime,
            endTime,
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

  private convertStringToDate(s: string, e: string) {
    const start = new Date(s);
    const end = new Date(e);
    return { start, end };
  }
}
