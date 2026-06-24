import { TimeRangeQueryDto } from '@/businesses/dto/time-range-query.dto';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DateTime } from 'luxon';
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

    await this.validateBusiness(businessId);

    const { start, end } = this.convertStringToDate(startTime, endTime);

    await this.blocksOverlap.validate(
      businessId,
      start.toUTC().toJSDate(),
      end.toUTC().toJSDate(),
    );

    const block = await this.createBlockRecord(
      businessId,
      start.toUTC().toJSDate(),
      end.toUTC().toJSDate(),
      reason,
    );
    return { block };
  }

  async get(query?: TimeRangeQueryDto) {
    if (!query?.from || !query?.to) {
      throw new BadRequestException('from and to are required');
    }

    const from = DateTime.fromISO(query.from, { setZone: true })
      .toUTC()
      .toJSDate();
    const to = DateTime.fromISO(query.to, { setZone: true }).toUTC().toJSDate();

    const blocks = await this.prisma.availabilityBlock.findMany({
      where: {
        AND: [{ startTime: { lt: to } }, { endTime: { gt: from } }],
      },
    });

    if (blocks.length === 0) {
      throw new NotFoundException('No blocks found on this time period');
    }

    return blocks;
  }

  async delete(id: number) {
    return await this.prisma.availabilityBlock.delete({ where: { id } });
  }

  private async validateBusiness(id: number) {
    const business = await this.prisma.business.findUnique({
      where: { id },
    });
    if (!business) throw new NotFoundException('Business not found');
  }

  private async createBlockRecord(
    businessId: number,
    startTime: Date,
    endTime: Date,
    reason?: string,
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

  private convertStringToDate(startTime: string, endTime: string) {
    const start = DateTime.fromISO(startTime, { setZone: true });
    const end = DateTime.fromISO(endTime, { setZone: true });

    if (!start.isValid || !end.isValid) {
      throw new BadRequestException('Invalid datetime format');
    }

    if (end <= start) {
      throw new BadRequestException('endTime must be after startTime');
    }

    return { start, end };
  }
}
