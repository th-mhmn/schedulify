import { PrismaService } from '@/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class ResourceService {
  constructor(private prisma: PrismaService) {}

  private normalizeId(input: unknown): number {
    const raw = Array.isArray(input) ? input[0] : input;

    if (typeof raw === 'number') {
      if (!Number.isInteger(raw)) throw new BadRequestException('Invalid id');
      return raw;
    }

    if (typeof raw === 'string') {
      if (!/^\d+$/.test(raw)) throw new BadRequestException('Invalid id');
      return parseInt(raw, 10);
    }

    throw new BadRequestException('Invalid id');
  }

  async getResource(resourceType: string | null, resourceId: unknown) {
    const id = this.normalizeId(resourceId);

    switch (resourceType) {
      case 'users': {
        const user = await this.prisma.user.findUnique({
          where: { id },
        });
        if (!user) throw new BadRequestException('User not found');
        return user.id;
      }
      case 'businesses': {
        const business = await this.prisma.business.findUnique({
          where: { id },
        });
        if (!business) throw new BadRequestException('Business not found');
        return business.ownerId;
      }
      case 'blocks': {
        const block = await this.prisma.availabilityBlock.findUnique({
          where: { id },
          include: { business: true },
        });
        if (!block) throw new BadRequestException('Block not found');
        return block.business?.ownerId;
      }
      default:
        throw new BadRequestException('Resource not found');
    }
  }
}
