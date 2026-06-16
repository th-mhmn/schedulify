import { PrismaService } from '@/prisma.service';
import { ConflictException, Injectable } from '@nestjs/common';

@Injectable()
export class BlocksOverlapService {
  constructor(private readonly prisma: PrismaService) {}
  async validate(businessId: number, start: Date, end: Date) {
    const blocksOverlap = Boolean(
      await this.prisma.availabilityBlock.findFirst({
        where: {
          businessId,
          endTime: { gt: start },
          startTime: { lt: end },
        },
      }),
    );
    if (blocksOverlap)
      throw new ConflictException('Blocks are overlapping on this time-span');
  }
}
